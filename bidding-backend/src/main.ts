import { NestFactory } from '@nestjs/core';
import { AppModule } from './root_application_module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enabling CORS for frontend
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Bidding Backend is running on: http://localhost:${port}`);
}
bootstrap();
