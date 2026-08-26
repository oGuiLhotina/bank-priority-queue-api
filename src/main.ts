import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ErroDeDominioFilter } from './shared/presentation/erro-de-dominio.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const porta = Number(process.env.PORT ?? 3000);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ErroDeDominioFilter());

  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('BankPriorityQueueApi')
      .setDescription(
        'Fila de atendimento bancario com prioridade. A ordem e mantida por um heap binario ' +
          'proprio, com politica de prioridade explicita (perfil legal, tipo de servico e ' +
          'envelhecimento por tempo de espera), desempate por senha sequencial e exclusao logica.',
      )
      .setVersion('1.0')
      .addTag('atendimentos-bancarios', 'CRUD da fila e regra de prioridade')
      .build(),
  );
  SwaggerModule.setup('docs', app, documento, {
    customSiteTitle: 'BankPriorityQueueApi',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(porta, '0.0.0.0');
  new Logger('bootstrap').log(`API em http://localhost:${porta} — documentacao em /docs`);
}

void bootstrap();
