# /movie-chatbot-project/test_query_router.py

import chromadb
from sentence_transformers import SentenceTransformer
import time
import json # 필터 JSON 파싱 및 예쁜 출력을 위해

# --- 설정 ---
MODEL_NAME = "jhgan/ko-sbert-nli"
DB_PATH = "./Data/chroma.db/"
COLLECTION_NAMES = ["movies_overview", "movies_title", "movies_director", "movies_actors"]

# --- 1. 임베딩 모델 로드 ---
print(f"'{MODEL_NAME}' 모델을 로드합니다...")
start_time = time.time()
try:
    model = SentenceTransformer(MODEL_NAME)
except Exception as e:
    print(f"모델 로드 실패: {e}")
    exit()
print(f"모델 로드 완료. ({time.time() - start_time:.2f}초)")

# --- 2. ChromaDB 연결 및 4개 컬렉션 확인 ---
print(f"Vector DB ({DB_PATH})에 연결합니다...")
db_collections = {}
try:
    client = chromadb.PersistentClient(path=DB_PATH)
    for name in COLLECTION_NAMES:
        collection = client.get_collection(name=name)
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
    exit()

# --- 3. 대화형 라우팅/필터링 테스트 ---
print("\n--- 🎬 영화 벡터 검색 라우터 테스트 ---")
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
        print("(예시) 청불 등급: {\"certification\": {\"$eq\": \"청소년 관람불가\"}}")
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
        # 1. 쿼리 -> 벡터로 변환
        query_vector = model.encode(query_text).tolist()

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
            print(f"  검색된 Document: '{doc}'") # 어떤 벡터가 매칭되었는지
            print(f"  영화 제목: {meta.get('title', 'N/A')} ({meta.get('release_date', 'N/A')[:4]})")
            print(f"  감독: {meta.get('director', 'N/A')}")
            print(f"  평점: {meta.get('vote_average', 0.0)}")
            print(f"  등급: {meta.get('certification', 'N/A')}")
    except Exception as e:
        print(f"검색 중 오류 발생: {e}")
    except KeyboardInterrupt:
        print("\n테스트를 강제 종료합니다.")
        break