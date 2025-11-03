# etl/run_update.py (라우터 방식 수정본)

import os
import time
import pandas as pd
from tqdm import tqdm
from dotenv import load_dotenv
import chromadb
from sentence_transformers import SentenceTransformer

# 우리 파일 임포트
from kobis_loader import get_popular_movie_list
from tmdb_loader import find_tmdb_id, get_tmdb_details

# --- (LOAD) ---
def initialize_db(path="./Data/chroma.db"):
    """
Success!
ChromaDB 클라이언트를 초기화하고 4개의 전문 컬렉션을 생성합니다."""
    if not os.path.exists(path):
        os.makedirs(path)
    client = chromadb.PersistentClient(path=path)
    
    # 4개의 전문 컬렉션 생성
    collections = {
        "overview": client.get_or_create_collection(name="movies_overview"),
        "title": client.get_or_create_collection(name="movies_title"),
        "director": client.get_or_create_collection(name="movies_director"),
        "actors": client.get_or_create_collection(name="movies_actors")
    }
    print("ChromaDB: 4개의 전문 컬렉션(overview, title, director, actors) 준비 완료.")
    return collections

def embed_and_store(embedding_model, collections, movie_details):
    """
    하나의 영화 상세 정보를 받아 4개의 컬렉션에 각각 전문화된 데이터를 임베딩하고 저장합니다.
    """
    
    # --- 1. 공통 메타데이터 준비 (모든 컬렉션에 저장될 원본 정보) ---
    # (날짜, 평점, 성인등급 등 필터링 정보 포함)
    kobis_code = movie_details['kobis_code'] # 고유 ID
    metadata = {
        "kobis_code": kobis_code,
        "tmdb_id": str(movie_details['tmdb_id']),
        "title": movie_details['title'],
        "release_date": movie_details['release_date'],
        "director": movie_details['director'],
        "actors": ", ".join(movie_details['actors']),
        "genres": ", ".join(movie_details['genres']),
        "certification": movie_details['certification'], # 성인 등급
        "vote_average": movie_details['vote_average'],   # 평점
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
        collections['overview'].add(
            embeddings=embedding_model.encode(doc_overview).tolist(),
            documents=[doc_overview],
            metadatas=[metadata],
            ids=[kobis_code]
        )
        
        # --- Collection 2: 영화 제목 ---
        doc_title = movie_details['title']
        collections['title'].add(
            embeddings=embedding_model.encode(doc_title).tolist(),
            documents=[doc_title],
            metadatas=[metadata],
            ids=[kobis_code]
        )

        # --- Collection 3: 감독 ---
        doc_director = movie_details['director']
        if doc_director != "정보 없음":
            collections['director'].add(
                embeddings=embedding_model.encode(doc_director).tolist(),
                documents=[doc_director],
                metadatas=[metadata],
                ids=[kobis_code]
            )

        # --- Collection 4: 배우 (상위 3명만 개별 저장) ---
        # "톰 행크스, 톰 크루즈"가 아니라 "톰 행크스" / "톰 크루즈"로 검색되도록
        for actor in movie_details['actors'][:3]: # 상위 3명
            doc_actor = actor
            actor_specific_id = f"{kobis_code}_{actor.replace(' ', '')}" # 예: "12345_TomHanks"
            collections['actors'].add(
                embeddings=embedding_model.encode(doc_actor).tolist(),
                documents=[doc_actor],
                metadatas=[metadata], # 메타데이터는 영화 정보 그대로
                ids=[actor_specific_id] # ID는 영화ID+배우명으로 고유하게
            )
            
    except Exception as e:
        print(f"DB 저장 중 오류 발생 (영화 ID: {kobis_code}): {e}")

# --- (MAIN EXECUTION) ---
def main():
    # 1. 환경 변수 로드
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    KOBIS_KEY = os.getenv("KOBIS_API_KEY")
    TMDB_KEY = os.getenv("TMDB_API_KEY")
    if not all([KOBIS_KEY, TMDB_KEY]):
        print("오류: .env 파일에 KOBIS_API_KEY, TMDB_API_KEY가 설정되었는지 확인하세요.")
        return

    # 2. 무료 임베딩 모델 로드
    print("로컬 임베딩 모델 로드 중...")
    model_name = "jhgan/ko-sbert-nli" 
    try:
        embedding_model = SentenceTransformer(model_name)
    except Exception as e:
        print(f"임베딩 모델 로드 실패: {e}")
        return
    print(f"'{model_name}' 모델 로드 완료.")

    # 3. DB 초기화 (4개 컬렉션 생성)
    # [중요] 실행 전 기존 Data/chroma.db 폴더를 삭제하세요.
    db_collections = initialize_db()

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
        # (ETL 단계에서는 TRANSFORM이 거의 없고, LOAD가 핵심)
        
        # 'details' 딕셔너리에 KOBIS 코드를 추가해서 넘겨줌
        details['kobis_code'] = movie_cd
        
        # [수정] 배치 처리를 하지 않고 1개씩 바로 저장 (구조가 복잡해져서)
        embed_and_store(embedding_model, db_collections, details)
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