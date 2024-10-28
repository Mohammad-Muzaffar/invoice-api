# Invoice API's

## Steps to run:

1. Clone the repo and install dependencies.

    ```bash
    npm install
    ```

2. Install Docker if you don't have it already installed.

3. Create a docker volume:
    ```bash
    sudo docker volume create postgres_data
    ```

4. Run docker container:
    ```bash
    sudo docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres
    ```

5. run npm install

6. Open the root folder and in terminal migrate the DB:
    ```bash
    npx prisma migrate dev
    ```
7. Run the project:
    ```bash
    npm run dev
    ```
