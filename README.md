# GitExplorer

A simple command line tool for outputting details on git repos

## Usage

Usage is limited at the moment but can/will be improved. 

For now, simply:
1. Create a [Personal Access Token](https://github.company.com/settings/tokens) in your GitHub Enterprise account.
2. Add the env variable TOKEN to your shell
3. Run the script 

## Command Line Arguments

```
--contrib - will add contributor column
--repo - will add a repo link column
--uses - will add the uses from the search query
```

## Example1

```bash
gitexplorer $ node index.js "informed filename:package.json" --contrib --repo
```

Example output from above

... TODO put test results here

```
TOKEN ghp_********
myArgs:  [ 'informed filename:package.json', '--contrib', '--repo' ]
-------------------------------------
SEARCH: informed filename:package.json
COUNT: 20
PAGES: 1
Making request for page 1 ...
-------------------------------------
Reposearch Complete 18 repos found.
```

## Example2

```bash
gitexplorer $ node index.js "informed filename:package.json" --reposearch "Debug" --uses
```

Example output from above

... TODO put test results here
