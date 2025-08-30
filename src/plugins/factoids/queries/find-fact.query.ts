import { Query } from '@nestjs/cqrs';
import type { FindFactQueryArgs, FindFactQueryResult } from '../factoids.types';
import {
  SimilarityAlgorithm,
  MIN_CONFIDENCE_THRESHOLD,
} from '../factoids.constants';

export class FindFactQuery extends Query<FindFactQueryResult> {
  constructor(private readonly args: FindFactQueryArgs) {
    super();
  }

  get chatId(): string {
    return this.args.chatId;
  }

  get subject(): string {
    return this.args.subject;
  }

  get algorithm(): SimilarityAlgorithm {
    return this.args.algorithm || SimilarityAlgorithm.LEVENSHTEIN;
  }

  get minConfidence(): number {
    return this.args.minConfidence || MIN_CONFIDENCE_THRESHOLD;
  }
}
