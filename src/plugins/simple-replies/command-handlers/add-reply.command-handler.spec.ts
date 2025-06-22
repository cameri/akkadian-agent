import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AddReplyCommand } from '../commands/add-reply.command';
import { Reply } from '../schemas/reply.schema';
import { ReplyRepository } from '../simple-replies.repository';
import { PatternType, ResponseType } from '../simple-reply.constants';
import { AddReplyCommandHandler } from './add-reply.command-handler';

describe('AddReplyCommandHandler', () => {
  let handler: AddReplyCommandHandler;
  let repository: jest.Mocked<ReplyRepository>;

  beforeEach(async () => {
    function SimpleReplyModel() {}

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Reply.name),
          useValue: SimpleReplyModel,
        },
        AddReplyCommandHandler,
        {
          provide: ReplyRepository,
          useValue: createMock<ReplyRepository>(),
        },
      ],
    }).compile();

    handler = module.get<AddReplyCommandHandler>(AddReplyCommandHandler);
    repository = module.get(ReplyRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create a reply and return success message', async () => {
      const pattern = 'hello';
      const patternType = PatternType.Exact;
      const response = 'response';
      const responseType = ResponseType.Text;
      const command = new AddReplyCommand({
        pattern,
        patternType,
        response,
        responseType,
      });

      const result = await handler.execute(command);

      expect(repository.create).toHaveBeenCalledWith({
        pattern,
        patternType,
        response,
        responseType,
      });
      expect(result).toEqual({
        result: true,
      });
    });
  });
});
