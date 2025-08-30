import { Query } from '@nestjs/cqrs';
import type {
  SearchFactsQueryArgs,
  SearchFactsQueryResult,
} from '../factoids.types';
import {
  SimilarityAlgorithm,
  MIN_CONFIDENCE_THRESHOLD,
} from '../factoids.constants';

export class SearchFactsQuery extends Query<SearchFactsQueryResult> {
  constructor(private readonly args: SearchFactsQueryArgs) {
    super();
  }

  get chatId(): string {
    return this.args.chatId;
  }

  get query(): string {
    return this.args.query;
  }

  get limit(): number {
    return this.args.limit || 10;
  }

  get algorithm(): SimilarityAlgorithm {
    return this.args.algorithm || SimilarityAlgorithm.LEVENSHTEIN;
  }

  get minConfidence(): number {
    return this.args.minConfidence || MIN_CONFIDENCE_THRESHOLD;
  }
}
