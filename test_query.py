# /movie-chatbot-project/test_query.py (OpenAI API 사용)

import os
import chromadb
import time
import json 
from dotenv import load_dotenv

# [변경] OpenAI 라이브러리를 가져옵니다.
from openai import OpenAI 

# --- 설정 ---
# [변경] OpenAI 모델 이름을 지정합니다. (ETL과 동일해야 함)
MODEL_NAME = "text-embedding-3-small"
DB_PATH = "./Data/chroma.db/"
COLLECTION_NAMES = ["movies_overview", "movies_title", "movies_director", "movies_actors"]

# --- 1. [변경] OpenAI 클라이언트 초기화 ---
print(f"'{MODEL_NAME}' 모델을 사용하기 위해 OpenAI 클라이언트를 초기화합니다...")
start_time = time.time()
try:
    # .env 파일에서 API 키 로드
    load_dotenv()
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        raise ValueError(".env 파일에 OPENAI_API_KEY가 설정되지 않았습니다.")
        
    # OpenAI 클라이언트 인스턴스 생성
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

except Exception as e:
    print(f"OpenAI 클라이언트 초기화 실패: {e}")
    exit()
print(f"OpenAI 클라이언트 준비 완료. ({time.time() - start_time:.2f}초)")


# --- 2. ChromaDB 연결 및 4개 컬렉션 확인 ---
print(f"Vector DB ({DB_PATH})에 연결합니다...")
db_collections = {}
try:
    client = chromadb.PersistentClient(path=DB_PATH)
    
    # [중요] DB에 연결할 때 OpenAI 임베딩 함수를 명시해줘야 합니다.
    # (ETL 스크립트가 OpenAI로 만들었기 때문에, 테스트기도 동일한 함수를 지정해야 함)
    openai_ef = chromadb.utils.embedding_functions.OpenAIEmbeddingFunction(
                    api_key=OPENAI_API_KEY,
                    model_name=MODEL_NAME
                )
    
    for name in COLLECTION_NAMES:
        # [변경] get_collection 시 embedding_function을 명시
        collection = client.get_collection(
            name=name, 
            embedding_function=openai_ef
        )
        
        count = collection.count()
        if count == 0:
            print(f"경고: '{name}' 컬렉션에 데이터가 없습니다. ETL 스크립트를 확인하세요.")
        else:
            print(f"  - '{name}' 컬렉션 연결 성공. (총 {count}개 항목)")
        db_collections[name] = collection
    
    if not db_collections:
        print("오류: DB에 연결할 컬렉션이 없습니다.")
        exit()
        
except Exception as e:
    print(f"DB 연결 실패: {e}")
    print("ETL 스크립트를 먼저 실행해서 './Data/chroma.db/' 폴더가 생성되었는지 확인하세요.")
    print("오류 상세: ", e) # [추가] 오류 상세 내용 출력
    exit()

def get_embedding_from_openai(text):
    """[신규] OpenAI API를 호출하여 텍스트의 임베딩 벡터를 반환하는 함수"""
    response = openai_client.embeddings.create(
        model=MODEL_NAME,
        input=[text] # 텍스트를 배열에 담아 전달
    )
    # response.data[0].embedding이 벡터(숫자 리스트)입니다.
    return response.data[0].embedding

# --- 3. 대화형 라우팅/필터링 테스트 ---
print("\n--- 🎬 영화 벡터 검색 라우터 테스트 (OpenAI) ---")
print("종료하려면 'exit' 또는 'q'를 입력하세요.")

while True:
    try:
        # --- (LLM 라우터가 할 일 1) 컬렉션 선택 ---
        print("\n--- [1. 라우팅] ---")
        print("검색할 컬렉션을 선택하세요 (LLM 라우터 역할 시뮬레이션):")
        print("  1: overview (줄거리/의미)")
        print("  2: title (제목)")
        print("  3: director (감독)")
        print("  4: actors (배우)")
        
        choice = input("> 컬렉션 선택 (1-4): ")
        if choice.lower() in ['exit', 'q']: break
        
        collection_map = {'1': 'movies_overview', '2': 'movies_title', '3': 'movies_director', '4': 'movies_actors'}
        if choice not in collection_map:
            print("잘못된 선택입니다.")
            continue
        
        selected_collection_name = collection_map[choice]
        selected_collection = db_collections[selected_collection_name]
        print(f"-> '{selected_collection_name}' 컬렉션을 검색합니다.")

        # --- (LLM 라우터가 할 일 2) 벡터 쿼리 입력 ---
        print("\n--- [2. 쿼리] ---")
        query_text = input(f"> '{selected_collection_name}'에서 검색할 쿼리 입력: ")
        if query_text.lower() in ['exit', 'q']: break
        if not query_text: continue

        # --- (LLM 라우터가 할 일 3) 필터 입력 ---
        print("\n--- [3. 필터] ---")
        print("(예시) 평점 8.5 이상: {\"vote_average\": {\"$gte\": 8.5}}")
        print("(예시) 2010년 이후: {\"release_date\": {\"$gte\": \"2010-01-01\"}}")
        filter_str = input("> 메타데이터 필터 (JSON 문자열, 없으면 Enter): ")

        query_filters = None
        if filter_str:
            try:
                query_filters = json.loads(filter_str)
                print(f"-> 필터 적용: {query_filters}")
            except json.JSONDecodeError as e:
                print(f"필터 JSON 형식이 잘못되었습니다: {e}")
                continue

        # --- [DB 검색 실행] ---
        # 1. [변경] 쿼리 -> OpenAI API로 벡터 변환
        print("OpenAI API로 쿼리 텍스트를 임베딩하는 중...")
        query_vector = get_embedding_from_openai(query_text)
        print("임베딩 완료.")

        # 2. Vector DB 검색 (필터 적용!)
        query_args = {
            'query_embeddings': [query_vector],
            'n_results': 3,
            'include': ["metadatas", "documents", "distances"]
        }
        
        if query_filters:
            query_args['where'] = query_filters # 핵심: 필터 적용

        results = selected_collection.query(**query_args)

        # --- [결과 출력] ---
        print(f"\n--- 🔍 '{selected_collection_name}' 검색 결과 (Top 3) ---")
        
        if not results['ids'][0]:
            print("결과: 검색된 영화가 없습니다. (필터 조건이 너무 까다로울 수 있습니다)")
            continue

        for i, (doc, dist, meta) in enumerate(zip(results['documents'][0], results['distances'][0], results['metadatas'][0])):
            print(f"\n[Rank {i+1}] (유사도 거리: {dist:.4f})")
            # [변경] OpenAI 모델은 코사인 유사도 기반이라 거리가 0~2 사이 (0에 가까울수록 유사)
            print(f"  검색된 Document: '{doc.strip()}'") 
            print(f"  영화 제목: {meta.get('title', 'N/A')} ({meta.get('release_date', 'N/A')[:4]})")
            print(f"  감독: {meta.get('director', 'N/A')}")
            print(f"  평점: {meta.get('vote_average', 0.0)}")
            print(f"  등급: {meta.get('certification', 'N/A')}")
            
    except Exception as e:
        print(f"검색 중 오류 발생: {e}")
    except KeyboardInterrupt:
        print("\n테스트를 강제 종료합니다.")
        break