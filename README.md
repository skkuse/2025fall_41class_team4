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
src/
├── app.module.ts                 # [메인] 모든 모듈을 하나로 묶는 루트 모듈
├── main.ts                       # [메인] 앱 실행 엔트리 포인트
│
├── common/                       # [공통] 여러 모듈에서 함께 쓰는 데이터 타입 정의
│   └── interfaces/
│       └── chat.interface.ts     # 모듈끼리 주고받을 데이터 규격 (DTO)
│
├── chat/                         #  
│   ├── chat.controller.ts        # 사용자 요청(POST /chat)을 받음
│   ├── chat.service.ts           # 분석 -> 교정 -> 검색 -> 답변생성 순서대로 지시
│   └── chat.module.ts            # 하위 4개 모듈을 Imports하여 Service들을 연결
│
├── query-analysis/               # (Step 1, 2)
│   ├── query-analysis.service.ts # 사용자 질문을 분석해 JSON(의도, 키워드)으로 변환
│   └── query-analysis.module.ts
│
├── query-refinement/             # (Step 3) - ChromaDB 담당 (RAG Part)
│   ├── query-refinement.service.ts  # 분석된 키워드의 오타를 수정하고 정규화
│   └── rag.module.ts
│
├── tmdb-client/                         # (Step 4) - 외부 API 담당
│   ├── tmdb.service.ts           # 정규화된 키워드로 실제 영화 정보 & 포스터 검색
│   └── tmdb.module.ts
│
└── llm-response/                 # (Step 5) - 최종 답변 생성
    ├── llm-response.service.ts   # 수집된 영화 정보를 바탕으로 사용자에게 줄 답변 작성
    └── llm-response.module.ts
```

## DataBase 테스트 방법
1. 카카오톡으로 보낸 링크를 통해 드라이브에서 Data를 받아온다
2. Data를 폴더 맨위에 옮긴다.(etl 폴더 바깥임)
3. test_query.py를 실행한다.
4. 실행한 뒤 무엇으로 질문할 것인지 번호를 입력해 결정한다.(줄거리 빼고는 꽤 정상적으로 돌아가는것 확인, 또한 나중에 무엇을 기준으로 질문할껀지는 GPT API에 쿼리 다듬으면서 물을 예정)
5. 질문한 쿼리를 입력한다.
6. 개봉날짜와 성인물 등급 등 필요한 제약조건를 입력한다.(테스트 안해봄)

## Project setup

1. git clone으로 프로젝트를 받아옵니다.
```bash
$ git clone https://github.com/skkuse/2025fall_41class_team4.git 
```
2. 최상단 위치에 .env 파일을 만드셔서 해당 파일 내에 KOBIS, TMDB, OPENAI API 키를 작성해놓으시면 됩니다.
3. 패키지 설치
```bash
$ npm install
```
## ChromaDB Database Setting

1. 주어진 Data 파일을 Database 폴더 안에 넣어둡니다. (./Database/Data/chromdb..) 
2. 해당 Database 폴더 안에서 python 가상환경을 설치해주고, requirements도 설치해줍니다.
```bash
# python 가상환경 설치
$ python -m venv myenv
# requirements 설치
$ pip install -r requirements.txt 
# 가상환경 키기 - 가상환경을 킨 상태로 ChromaDB를 실행햐셔야합니다.
$ source myenv/bin/activate 
```
3. 가상환경을 킨 상태로 chroma.db의 경로에 맞게 DB를 실행시켜줍니다.
```bash
# 경로에 맞춰 ./Database/Data/chroma.db 부분을 수정해주시면 됩니다.
$ chroma run --path ./Database/Data/chroma.db
```

## Compile and run the project

```bash
# watch mode - 해당 watch mode로 실행하시면 됩니다.
$ npm run start:dev

# development
$ npm run start

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
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
