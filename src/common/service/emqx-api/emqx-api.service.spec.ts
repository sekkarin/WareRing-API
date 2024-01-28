import { Test, TestingModule } from '@nestjs/testing';
import { EmqxApiService } from './emqx-api.service';

describe('EmqxApiService', () => {
  let service: EmqxApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmqxApiService],
    }).compile();

    service = module.get<EmqxApiService>(EmqxApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
