import { Test, TestingModule } from '@nestjs/testing';
import { ManageFileS3Service } from './up-load-file-s3.service';

describe('UpLoadFileS3Service', () => {
  let service: ManageFileS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManageFileS3Service],
    }).compile();

    service = module.get<ManageFileS3Service>(ManageFileS3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
