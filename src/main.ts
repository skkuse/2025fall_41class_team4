import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true, 
    transform: true, 
  }));

  const config = new DocumentBuilder()
    .setTitle('LLMuse API')
    .setDescription('영화 및 공연 추천 챗봇 API 문서')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // [CORS 설정 추가]
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,               
  });

  await app.listen(3001);
}
bootstrap();