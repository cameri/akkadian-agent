export const addReplyCommandRegExp =
  /^\/(add_)?reply(?<bot>@[^\s]+)? (?<pattern>[^\n]{1,256})$/;
export const removeReplyCommandRegExp =
  /^\/remove_reply(?<bot>@[^\s]+)? (?<pattern>[^\n]{1,256})$/;
