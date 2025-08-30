import { Module } from '@nestjs/common';
import { FactoidsModule } from './factoids/factoids.module';
import { SimpleRepliesModule } from './simple-replies/simple-replies.module';

/**
 * Centralized module that manages all plugin modules.
 * This module provides a clean architecture for plugin management
 * and acts as the single entry point for all bot plugins.
 */
@Module({
  imports: [SimpleRepliesModule, FactoidsModule],
  exports: [SimpleRepliesModule, FactoidsModule],
})
export class PluginsModule {}
