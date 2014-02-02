# Understand this demo

This demo shows a typical dev/test scenario where developers can
- Leverage Windows Azure to host their dev/test environments.
- Use Node.js azure mgmt library to automate the environment provision and deletion.

## Instructions

1. Run ``node provision-env.js`` to provsion a dev/test environment in Windows Azure containing a web site and a sql database.
2. Run ``azure site show <web site name>`` and check the git repo URL.
3. Run the following git commands under hello-azure folder.
    a. ``git init``
    b. ``git remote add azure <git repo URL>``
    c. ``git push origin master``
4. Browse the web site home page.
5. Browse the test result page at /tests. See all tests pass.
6. Run ``node delete-env.js`` to delete the dev/test environment.