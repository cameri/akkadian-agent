export interface AddReplyCommandArgs {
  pattern: string;
}

export interface AddReplyCommandResult {
  reply_text: string;
}

export interface RemoveReplyCommandArgs {
  pattern: string;
}

export interface RemoveReplyCommandResult {
  reply_text: string;
}
