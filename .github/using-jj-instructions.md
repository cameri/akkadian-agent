# Version Control Instructions

Use `jj` for version control. Do not use `git` directly. `jj` is a distributed version control system that is similar to Git but has some differences in its workflow and commands.
- Always create a new revision using `jj new -m "your message"` before making new edits.
- Update the description of a revision using `jj describe -m "your message"` after you are done making all changes if needed.
- To split your changes into parent and child revisions, use `jj split [-r revision] <file,...>`. Use -r to split a specific revision other than the current one. Use -p to split the revision into two parallel revisions instead of a parent and child.
- To create a new bookmark (a.k.a. branch), use `jj bookmark create <bookmark_name>`.
- To set a bookmark (a.k.a. move a branch) to a specific revision, use `jj bookmark set <bookmark_name> [--to <revision>]` or `jj bookmark move [--from <bookmark_name>] [--to <revision>]`.
- To delete a bookmark (a.k.a. branch), use `jj bookmark delete <bookmark_name>`.
- To list all bookmarks (a.k.a. branches), use `jj bookmark list`.
- Always use `jj git push` to push your bookmark to the remote repository. Do not use `git push` directly.

To see the diff of your changes:
jj diff

To update your working copy or see the status of your changes:
jj status

To see the log of your changes (e.g. to see the change history):
jj log

To see the log operations we've applied with jj:
jj op log

To squash the last two revisions:
jj squash

To undo the last revision:
jj undo

To rebase a revision and it's descendants on top of another revision:
jj rebase -s <source_revision> -d <destination_revision>