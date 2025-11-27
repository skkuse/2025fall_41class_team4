# etl/kobis_loader.py

import requests
import pandas as pd
from datetime import datetime, timedelta
import time
from tqdm import tqdm # 진행 상황 표시용

def get_weekly_boxoffice(api_key, target_dt):
    """특정 주의 주간 박스오피스 10위권 영화를 가져옵니다."""
    KOBIS_API_URL = "http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json"
    params = {
        'key': api_key,
        'targetDt': target_dt,
        'weekGb': '0' # 0: 주간
    }
    try:
        response = requests.get(KOBIS_API_URL, params=params)
        response.raise_for_status() 
        data = response.json()
        return data.get('boxOfficeResult', {}).get('weeklyBoxOfficeList', [])
    except requests.RequestException as e:
        print(f"KOBIS API Error for date {target_dt}: {e}")
        return []

def get_popular_movie_list(api_key, start_year=2004):
    """
    지정된 연도(start_year)부터 현재까지의 박스오피스 목록을 수집합니다.
    """
    
    # 2004년부터 현재까지 몇 주인지 계산
    weeks_to_fetch = (datetime.now().year - start_year + 1) * 52
    
    print(f"KOBIS: {start_year}년부터 현재까지 (약 {weeks_to_fetch}주) 박스오피스 데이터를 수집합니다...")
    
    all_movies = []
    target_date = datetime.now() - timedelta(days=7) 

    # tqdm으로 진행 상황 표시
    for _ in tqdm(range(weeks_to_fetch), desc="KOBIS 주간 박스오피스 수집 중"):
        target_dt_str = target_date.strftime('%Y%m%d')
        weekly_list = get_weekly_boxoffice(api_key, target_dt_str)
        
        for movie in weekly_list:
            all_movies.append({
                'movieCd': movie['movieCd'],
                'movieNm': movie['movieNm'],
                'openDt': movie['openDt'] # YYYY-MM-DD 형식
            })
        
        # 1주일 전으로 이동
        target_date -= timedelta(weeks=1) 
        
        # KOBIS API의 초당 10회 제한을 피하기 위해 0.1초 대기
        time.sleep(0.1) 

    if not all_movies:
        print("KOBIS: 수집된 영화 데이터가 없습니다.")
        return pd.DataFrame(columns=['movieCd', 'movieNm', 'openDt'])

    df = pd.DataFrame(all_movies)
    df.drop_duplicates(subset='movieCd', keep='first', inplace=True)
    
    print(f"KOBIS: 총 {len(df)}개의 고유한 영화 목록을 수집했습니다.")
    return df