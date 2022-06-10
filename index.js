//const queryString = 'q=' + encodeURIComponent('GitHub Octocat in:readme user:defunkt');
const { Octokit } = require("@octokit/core");

// Log out token making sure user has it
const TOKEN = process.env.TOKEN;
console.log('TOKEN', TOKEN);

// Log out the args
const myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);

// Create instance of octokit
const octokit = new Octokit({ auth: process.env.TOKEN });

// Delay func 
const delay = ms => new Promise(res => setTimeout(res, ms));

// Helper Repo search function
const getRepoSearch = async ({ q }) => {
   // Initial request to get the count
   const firstRes = await octokit.request("GET /search/code", {
    baseUrl: "https://github.company.com/api/v3",
    q,
    per_page: 100
  });

  console.log('-------------------------------------');
  console.log('SEARCH:', q);

  // Log Meta info
  console.log('COUNT:', firstRes.data.total_count);

  const pages = Math.ceil(firstRes.data.total_count / 100);
  console.log('PAGES:', pages);

  // We build map of repos from results
  const repos = new Map();

  // We cant go over 11 pages or we crash
  const max = pages < 10 ? pages : 10;   

  // Loop for each page
  for( let i = 1; i < max + 1; i++ ){
    console.log(`Making request for page ${i} ...`);
     // Initial request to get the count
    const response = await octokit.request("GET /search/code", {
      baseUrl: "https://github.company.com/api/v3",
      q: q,
      per_page: 100, 
      page: i
    });

    response.data.items.forEach( i => {
      if(!repos.get(i.repository.full_name ) ){
        repos.set( i.repository.full_name, { ...i.repository, count: 0 } )
      }
      const repo = repos.get( i.repository.full_name )
      repo.count = repo.count + 1;
      // console.log(i.repository.full_name);
    });
  }

  return repos;
}

// ------------------------------------------------------------------------
// Async function that gets all the shiznit
const go = async () => {

  // STEP1: Get all the repos based on this query string ------------------
  // returns map repo_name ==> RepoData )
  const repos = await getRepoSearch({ q: myArgs[0] } );

  console.log('-------------------------------------');
  console.log('Reposearch Complete', repos.size, 'repos found.');

  // COND_STEP: Get contributors ------------------------------------------
  if(myArgs.includes('--contrib')){
    const promises = [...repos].map(([name, r]) =>{
        // Example https://github.company.com/api/v3/repos/javascript/informed/contributors
      const contributors_url = r.contributors_url.replace('https://github.company.com/api/v3', '')
      return octokit.request(`GET ${contributors_url}`, {
        baseUrl: "https://github.company.com/api/v3",
      });
    })
    const results = await Promise.all(promises);
    // r.contributors = response.data;
    // console.log(results[0].data.map(u => u.login));

    [...repos].forEach(([name, r], i) =>{
      r.contributors = results[i].data.map(u => u.login);
    })
  }

  // COND_STEP: sub query on a repo --------------------------------------
  if(myArgs.includes('--reposearch')){

    // Example: 
    // $ node index.js "design-system filename:package.json" --reposearch "tds-btn"
    // >> myArgs:  [ 'design-system filename:package.json', '--reposearch', 'tds-btn' ]
    // >> index = 2
    // searchString = tds-btn repo:repo-name
    const searchStringIndex = myArgs.indexOf('--reposearch') + 1;
    const searchString = myArgs[searchStringIndex];

    const funcs = [...repos].map(([name, r], i) =>{
        return () => getRepoSearch({q: `${searchString} repo:${r.full_name}`})
    })

    let results = [];

    while (funcs.length) {
      // 20 at a time
      const res = await Promise.all( funcs.splice(0, 20).map(f => f()) );
      results = [...results, ...res];

      // Wait 30 seconds 
      if(funcs.length){
        console.log('--------------WAITING FOR RATE LIMIT---------------');
        await delay(60000);
      }
    }

    [...repos].forEach(([name, r], i) =>{
      r.count = results[i] ? results[i].get(name)?.count : 0;
    })
  }

  // BUILD HEADINGS  ------------------------------------

  let heading1 = '|          Name            |';
  let heading2 = '| ------------------------ |';

  if( myArgs.includes('--uses') ){
    heading1 += "   Uses   |";
    heading2 += " -------- |";
  } 

  if( myArgs.includes('--repo') ){
    heading1 += " Repo |";
    heading2 += " ---- |";
  } 

  if( myArgs.includes('--contrib') ){
    heading1 += " Contributors |";
    heading2 += " ------------ |";
  } 

  // LOG HEADINGS ---------------------------------------
  console.log(heading1);
  console.log(heading2);

  // LOG ROWS -------------------------------------------
  [...repos].forEach(([name, repo], i) => {

    // if(i === 1){
    //  console.log(repo);
    // }

    let row = `| ${name} |`;

    if( myArgs.includes('--uses') ){
      row += ` ${repo.count} |`;
    } 
  
    if( myArgs.includes('--repo') ){
      row += ` [Link](${repo.html_url}) |`;
    } 

    if( myArgs.includes('--contrib') ){
      row += ` ${repo.contributors.slice(0,4)} |`;
    } 

    console.log(row);

    if(myArgs.includes('--split') && (i + 1) % 40 === 0){
      console.log('\n');
      console.log(heading1);
      console.log(heading2);
    }

  });
};

// RUN THAT SHIT! ------------------------------------------
go();
