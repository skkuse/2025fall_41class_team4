# etl/tmdb_loader.py

import requests
import time

TMDB_API_URL = "https://api.themoviedb.org/3"

def find_tmdb_id(api_key, movie_title, release_year):
    """영화 제목과 개봉 연도로 TMDB ID를 검색합니다."""
    search_url = f"{TMDB_API_URL}/search/movie"
    params = {
        'api_key': api_key,
        'query': movie_title,
        'language': 'ko-KR',
        'primary_release_year': release_year
    }
    try:
        response = requests.get(search_url, params=params)
        response.raise_for_status()
        results = response.json().get('results', [])
        if results:
            return results[0]['id']
    except requests.RequestException as e:
        print(f"TMDB Search Error for {movie_title}: {e}")
    
    # TMDB API 속도 제한(Rate Limit)을 피하기 위해 0.1초 대기
    time.sleep(0.1) 
    return None

def get_tmdb_details(api_key, tmdb_id):
    """
    TMDB ID로 영화의 상세 정보 (최대한 많이) 가져옵니다.
    'append_to_response'를 사용해 credits(배우/제작진), keywords, release_dates, external_ids, recommendations를 한 번에 요청합니다.
    """
    details_url = f"{TMDB_API_URL}/movie/{tmdb_id}"
    params = {
        'api_key': api_key,
        'language': 'ko-KR',
        'append_to_response': 'credits,keywords,release_dates,external_ids,recommendations'
    }
    
    try:
        response = requests.get(details_url, params=params)
        response.raise_for_status()
        data = response.json()

        # --- 기본 정보 ---
        details = {
            'tmdb_id': tmdb_id,
            'title': data.get('title', data.get('original_title', '제목 없음')),
            'overview': data.get('overview', '줄거리 정보 없음'),
            'tagline': data.get('tagline', ''),
            'genres': [g['name'] for g in data.get('genres', [])],
            'release_date': data.get('release_date', ''),
            'vote_average': data.get('vote_average', 0.0),
            'vote_count': data.get('vote_count', 0),
            'popularity': data.get('popularity', 0.0),
            'runtime': data.get('runtime', 0),
            'poster_path': f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get('poster_path') else "",
            'imdb_id': data.get('external_ids', {}).get('imdb_id', '')
        }

        # --- 키워드 ---
        details['keywords'] = [kw['name'] for kw in data.get('keywords', {}).get('keywords', [])]

        # --- 배우 (최대 10명) ---
        details['actors'] = [
            cast['name'] for cast in data.get('credits', {}).get('cast', [])[:10]
        ]
        
        # --- 감독 (Director 찾기) ---
        director = "정보 없음"
        for crew in data.get('credits', {}).get('crew', []):
            if crew['job'] == 'Director':
                director = crew['name']
                break
        details['director'] = director

        # --- 한국 개봉일 및 관람 등급 ---
        certification = "정보 없음"
        for release in data.get('release_dates', {}).get('results', []):
            if release['iso_3166_1'] == 'KR':
                # 'certification' 필드가 있는 첫 번째 항목을 찾음
                for item in release.get('release_dates', []):
                    if item.get('certification'):
                        certification = item['certification']
                        break
                if certification != "정보 없음":
                    break
        details['certification'] = certification # 예: "15세 이상 관람가"
        
        # --- 추천 영화 제목 (최대 5개) ---
        details['recommendations'] = [
            rec['title'] for rec in data.get('recommendations', {}).get('results', [])[:5]
        ]

        return details
        
    except requests.RequestException as e:
        print(f"TMDB Details Error for ID {tmdb_id}: {e}")
        # API 속도 제한을 피하기 위해 0.1초 대기
        time.sleep(0.1)
    return None