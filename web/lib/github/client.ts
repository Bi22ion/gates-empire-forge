import { Octokit } from "octokit";

// This client will be used to fetch repo data for our AI Auditor
export const getGitHubRepoData = async (owner: string, repo: string, token?: string) => {
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });
    
    // We also want the languages used in the project
    const languages = await octokit.request("GET /repos/{owner}/{repo}/languages", {
      owner,
      repo,
    });

    return {
      name: data.name,
      description: data.description,
      stars: data.stargazers_count,
      languages: languages.data,
      url: data.html_url,
    };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    throw error;
  }
};
