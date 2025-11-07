# etl/run_update.py (OpenAI API + 4-Collection Router 방식)

import os
import pandas as pd
from tqdm import tqdm
from dotenv import load_dotenv
import chromadb
# [변경] OpenAI 임베딩 함수를 가져옵니다.
import chromadb.utils.embedding_functions as embedding_functions

# 우리 파일 임포트 (이 파일들은 수정 필요 없음)
from kobis_loader import get_popular_movie_list
from tmdb_loader import find_tmdb_id, get_tmdb_details

# --- (LOAD) ---
def initialize_db(embedding_function, path="./Data/chroma.db"):
    """
    ChromaDB 클라이언트를 초기화하고 4개의 전문 컬렉션을 생성합니다.
    [변경] 모든 컬렉션에 동일한 OpenAI 임베딩 함수를 적용합니다.
    """
    if not os.path.exists(path):
        os.makedirs(path)
    client = chromadb.PersistentClient(path=path)
    
    collections = {
        "overview": client.get_or_create_collection(
            name="movies_overview", 
            embedding_function=embedding_function
        ),
        "title": client.get_or_create_collection(
            name="movies_title", 
            embedding_function=embedding_function
        ),
        "director": client.get_or_create_collection(
            name="movies_director", 
            embedding_function=embedding_function
        ),
        "actors": client.get_or_create_collection(
            name="movies_actors", 
            embedding_function=embedding_function
        )
    }
    print("ChromaDB: 4개의 전문 컬렉션(overview, title, director, actors) 준비 완료.")
    return collections

def embed_and_store(collections, movie_details):
    """
    [변경]
    하나의 영화 상세 정보를 받아 4개의 컬렉션에 '문서(Document)'만 저장합니다.
    임베딩(벡터 변환)은 컬렉션에 할당된 OpenAI 함수가 자동으로 처리합니다.
    """
    
    # --- 1. 공통 메타데이터 준비 (모든 컬렉션에 저장될 원본 정보) ---
    kobis_code = movie_details['kobis_code'] # 고유 ID
    metadata = {
        "kobis_code": kobis_code,
        "tmdb_id": str(movie_details['tmdb_id']),
        "title": movie_details['title'],
        "release_date": movie_details['release_date'],
        "director": movie_details['director'],
        "actors": ", ".join(movie_details['actors']),
        "genres": ", ".join(movie_details['genres']),
        "certification": movie_details['certification'], 
        "vote_average": movie_details['vote_average'],   
        "poster_path": movie_details['poster_path'],
        "overview": movie_details['overview']
    }
    
    # --- 2. 각 컬렉션에 데이터 저장 ---
    try:
        # --- Collection 1: 줄거리/키워드 (의미 검색) ---
        doc_overview = f"""
장르: {", ".join(movie_details['genres'])}
태그라인: {movie_details['tagline']}
줄거리: {movie_details['overview']}
키워드: {", ".join(movie_details['keywords'])}
"""
        # [변경] .encode() 삭제, 'documents'로 텍스트 직접 전달
        collections['overview'].add(
            documents=[doc_overview],
            metadatas=[metadata],
            ids=[kobis_code]
        )
        
        # --- Collection 2: 영화 제목 ---
        doc_title = movie_details['title']
        collections['title'].add(
            documents=[doc_title],
            metadatas=[metadata],
            ids=[kobis_code]
        )

        # --- Collection 3: 감독 ---
        doc_director = movie_details['director']
        if doc_director != "정보 없음":
            collections['director'].add(
                documents=[doc_director],
                metadatas=[metadata],
                ids=[kobis_code]
            )

        # --- Collection 4: 배우 (상위 3명만 개별 저장) ---
        for actor in movie_details['actors'][:3]: 
            doc_actor = actor
            actor_specific_id = f"{kobis_code}_{actor.replace(' ', '')}"
            collections['actors'].add(
                documents=[doc_actor],
                metadatas=[metadata], 
                ids=[actor_specific_id] 
            )
            
    except Exception as e:
        print(f"DB 저장 중 오류 발생 (영화 ID: {kobis_code}): {e}")

# --- (MAIN EXECUTION) ---
def main():
    # 1. 환경 변수 로드
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    KOBIS_KEY = os.getenv("KOBIS_API_KEY")
    TMDB_KEY = os.getenv("TMDB_API_KEY")
    # [추가] OpenAI API 키 로드
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    if not all([KOBIS_KEY, TMDB_KEY, OPENAI_API_KEY]):
        print("오류: .env 파일에 KOBIS_API_KEY, TMDB_API_KEY, OPENAI_API_KEY가 모두 설정되었는지 확인하세요.")
        return

    # 2. [변경] OpenAI 임베딩 모델 준비 (로딩 시간 0초)
    print("OpenAI 임베딩 기능 ('text-embedding-3-small') 준비 중...")
    try:
        openai_ef = embedding_functions.OpenAIEmbeddingFunction(
                        api_key=OPENAI_API_KEY,
                        model_name="text-embedding-3-small"
                    )
    except Exception as e:
        print(f"OpenAI 임베딩 함수 생성 실패: {e}")
        return
    print("OpenAI 임베딩 기능 준비 완료.")

    # 3. DB 초기화 (4개 컬렉션 생성)
    # [변경] 생성된 openai_ef를 DB 초기화 시 전달
    db_collections = initialize_db(embedding_function=openai_ef)

    # 4. EXTRACT (KOBIS)
    kobis_movies_df = get_popular_movie_list(KOBIS_KEY, start_year=2004)
    if kobis_movies_df.empty:
        print("ETL 중단: KOBIS에서 가져올 영화가 없습니다.")
        return

    # 5. EXTRACT (TMDB) & TRANSFORM & LOAD
    print("TMDB: KOBIS 목록을 기반으로 TMDB 상세 정보 수집 및 4개 DB 임베딩을 시작합니다...")
    
    total_movies = kobis_movies_df.shape[0]
    processed_count = 0
    
    for _, row in tqdm(kobis_movies_df.iterrows(), total=total_movies, desc="영화 DB 구축 중"):
        movie_cd = row['movieCd']
        movie_nm = row['movieNm']
        release_year = row['openDt'][:4]

        # --- 5a. EXTRACT (TMDB) ---
        details = None
        try:
            tmdb_id = find_tmdb_id(TMDB_KEY, movie_nm, release_year)
            if tmdb_id:
                details = get_tmdb_details(TMDB_KEY, tmdb_id)
        except Exception as e:
             print(f"TMDB 처리 중 예외 발생 (영화: {movie_nm}): {e}")

        if not details or not details['overview'] or details['overview'] == '줄거리 정보 없음':
            continue

        # --- 5b. TRANSFORM & LOAD ---
        details['kobis_code'] = movie_cd
        
        # [변경] embed_and_store에 모델을 넘길 필요가 없어짐
        embed_and_store(db_collections, details)
        processed_count += 1

    print("\n--- ETL 작업 완료 ---")
    print(f"총 {total_movies}개의 KOBIS 영화 중 {processed_count}개의 유효한 영화를 처리했습니다.")
    print(f"DB 컬렉션별 카운트:")
    print(f"  - movies_overview: {db_collections['overview'].count()}개")
    print(f"  - movies_title: {db_collections['title'].count()}개")
    print(f"  - movies_director: {db_collections['director'].count()}개")
    print(f"  - movies_actors: {db_collections['actors'].count()}개 (배우 기준, 중복 영화 포함)")
    print(f"DB 위치: ./Data/chroma.db/")

if __name__ == "__main__":
    main()