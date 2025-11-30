import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // 추가

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO에 없는 속성은 거름
    forbidNonWhitelisted: true, // DTO에 없는 속성 오면 에러 발생
    transform: true, // 타입 자동 변환 (예: url params string -> number)
  }));

  await app.listen(3000);
}
bootstrap();