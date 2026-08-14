import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtendimentosModule } from './atendimentos/atendimentos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER', 'banco'),
        password: config.get<string>('POSTGRES_PASSWORD', 'banco'),
        database: config.get<string>('POSTGRES_DB', 'fila_de_atendimento'),
        autoLoadEntities: true,
        // Trabalho academico: o esquema nasce das entidades a cada boot. Em
        // producao isso viraria migracao versionada, nunca sincronizacao viva.
        synchronize: true,
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    AtendimentosModule,
  ],
})
export class AppModule {}
