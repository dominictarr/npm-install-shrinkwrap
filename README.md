# npm-install-shrinkwrap

Install a shrinkwrap or package-lock file directly.
just pulls down packages and unpacks in the right place.
does not mess with package-json or check the shrinkwrap
makes sense. Just does what it says on the tin and nothing else.

you may need to run `npm rebuild` after this script,
if compiling any modules are needed.

## Does

* pulls down modules from resolved url (surprisingly, npm doesn't seem to use this!)

## Not Yet

* doesn't actually check integrity code
* could check npm's cache for integrity code first.

PRs welcome.

## License

MIT



