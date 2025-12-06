<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## 파일 구조
```
backend/
├── .env                                          # [설정] MOVIE_DB_URL, PERFORMANCE_DB_URL 설정 필요
├── src/
│   ├── app.module.ts                             # [메인] SearchModule 등 통합 등록
│   ├── main.ts                                   # [메인] ValidationPipe 설정 필수
│   │
│   ├── chat/                                     # [오케스트레이터]
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts                    # POST /chat (Body: category, question)
│   │   ├── chat.service.ts                       # category에 따라 if문 분기 (Movie vs Perf)
│   │   └── dto/
│   │       └── chat-request.dto.ts
│   │
│   ├── query-analysis/                           # [분석] Brain (OpenAI)
│   │   ├── query-analysis.module.ts
│   │   ├── movie-query-analysis.service.ts       # (gpt-4.1-nano / genres)
│   │   └── performance-query-analysis.service.ts # (gpt-4.1-nano / type / Zod 사용)
│   │
│   ├── query-refinement/                         # [정제] Movie RAG (Chroma Port 8000)
│   │   ├── query-refinement.module.ts
│   │   └── query-refinement.service.ts           # 영화 오타 수정 전용 (http://localhost:8000)
│   │
│   ├── search/                                   # [검색] Hands (통합 모듈)
│   │   ├── search.module.ts                      # HttpModule, ConfigModule 포함
│   │   ├── movie-search.service.ts               # TMDB API 호출
│   │   └── performance-search.service.ts         # 공연 벡터 검색 (http://localhost:8001)
│   │
│   └── llm-response/                             # [답변] Mouth (OpenAI)
│       ├── llm-response.module.ts
│       ├── movie-llm-response.service.ts         # 영화 데이터 -> 답변
│       └── performance-llm-response.service.ts   # 공연 데이터 -> 답변
│
└── Database/
    └── Data/
        ├── movie.db/                             # (Port 8000) 연결
        └── performance.db/                       # (Port 8001) 연결
```

## Project setup

1. git clone으로 main 브랜치의 프로젝트를 받아옵니다.
```bash
$ git clone https://github.com/skkuse/2025fall_41class_team4.git 
```
2. 최상단 위치에 .env 파일을 만드셔서 해당 파일 내에 KOBIS, TMDB, OPENAI API 키를 작성해놓으시면 됩니다. (backend / frontend 각각 폴더 안에 개별적으로 넣으시면 됩니다.)
3. 패키지 설치 (backend / frontend 두 폴더 모두 실행)
```bash
$ npm install
```
## ChromaDB Database Setting

1. 주어진 Data 파일을 Database 폴더 안에 넣어둡니다. (./Database/Data/movie.db & performance.db) 
2. 해당 Database 폴더 안에서 python 가상환경을 설치해주고, requirements도 설치해줍니다. 
```bash
# python 가상환경 설치
$ python -m venv myenv

# requirements 설치
$ pip install -r requirements.txt 

# 가상환경 키기 - 가상환경을 킨 상태로 ChromaDB를 실행햐셔야합니다.
$ source myenv/bin/activate 
```
3. 가상환경을 킨 상태로 movie.db, performance.db의 경로에 맞게 DB를 실행시켜줍니다.
```bash
# 경로에 맞춰 ./Database/Data/chroma.db 부분을 수정해주시면 됩니다.
$ chroma run --path ./Database/Data/movie.db --port 8000
$ chroma run --path ./Database/Data/performance.db --port 8001
```

## Backend Compile and run the project

```bash
# watch mode - 해당 watch mode로 실행하시면 됩니다.
$ npm run start:dev
```

## Frontend Compile and run the project

```bash
# 동일합니다.
$ npm run start:dev
```

## 테스트 전 확인사항

```bash
프론트 / 백엔드 모두 실행해서 테스트하기 위해선 아래의 조건들을 확인해주세요.

1. movie.db 켰는가? 
$ chroma run --path ./Database/Data/movie.db --port 8000

2. performance.db 켰는가?
$ chroma run --path ./Database/Data/performance.db --port 8001

3. 서버를 실행하고 있는가?
$ npm run start:dev

4. 프론트를 실행하고 있는가?
$ npm run start:dev

4개 요소 모두 실행되고 있어야 합니다.
```

## Query 전송 가이드

```bash
POST URL (영화, 공연 공통): http://localhost:3000/chat 
Body의 JSON 형식으로 다음과 같이 요청 보내주셔야 합니다.

JSON - 영화
{
  "category": "movie",
  "question": "범죄도시 감독이 누구야?"
}

JSON - 공연
{
  "category": "performance",
  "question": "지브리 공연해?"
}
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

