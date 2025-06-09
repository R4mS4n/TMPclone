# Deployment Guide

This guide provides step-by-step instructions for deploying the MERN stack application. The architecture consists of three main parts:

1.  **Frontend**: A React/Vite application located in the `client` directory.
2.  **Backend**: A Node.js/Express API located in the `API` directory.
3.  **Database**: A MySQL database.

We will follow a setup using a mix of cloud providers:
*   **Frontend**: AWS S3 for static website hosting, with AWS CloudFront as a CDN.
*   **Backend**: AWS EC2 for running the Node.js server.
*   **Database**: Google Cloud SQL for a managed MySQL instance.

---

## Prerequisites

*   An AWS account.
*   A Google Cloud Platform (GCP) account.
*   [Node.js and npm](https://nodejs.org/en/) installed on your local machine.
*   [AWS CLI](https://aws.amazon.com/cli/) configured on your local machine (optional, but helpful).
*   [gcloud CLI](https://cloud.google.com/sdk/docs/install) configured on your local machine (optional, but helpful).
*   A code editor (like VS Code).
*   Git and a GitHub (or similar) repository for your project.

---

## Step 1: Set Up the Database (Google Cloud SQL)

First, we'll create a managed MySQL database instance on Google Cloud Platform.

1.  **Create a Cloud SQL Instance**:
    *   Navigate to the [Google Cloud SQL console](https://console.cloud.google.com/sql).
    *   Click "Create instance" and choose "MySQL".
    *   Provide an "Instance ID" (e.g., `my-app-database`) and set a strong password for the `root` user. Store this password securely.
    *   For machine type, you can start with a small one for development purposes.
    *   Under "Connections", ensure "Public IP" is selected. Under "Authorized networks", you must add the public IP address of your EC2 instance. For initial setup, you can use `0.0.0.0/0` to allow connections from anywhere, but it is critical to restrict this to your server's IP for security.
    *   Click "Create instance". It may take a few minutes to provision.

2.  **Collect Database Credentials**:
    *   Once the instance is created, go to its "Overview" page to find the **Public IP address**. This is your `DB_HOST`.
    *   You will need the following for your backend configuration:
        *   `DB_HOST`: The Public IP address of the Cloud SQL instance.
        *   `DB_USER`: The default user is `root`.
        *   `DB_PASSWORD`: The root password you created.
        *   `DB_NAME`: You will need to connect to the database to create a new schema for your application (e.g., `techheaven`). You can do this using the Google Cloud Shell or a local client.
        *   `DB_PORT`: The default is `3306`.

---

## Step 2: Deploy the Backend (AWS EC2)

Next, we'll set up a virtual server to run our Node.js API.

1.  **Launch an EC2 Instance**:
    *   Navigate to the AWS EC2 console.
    *   Click "Launch instance".
    *   Choose an Amazon Machine Image (AMI), such as "Ubuntu".
    *   Choose an instance type. `t2.micro` is eligible for the free tier.
    *   Create a new key pair or use an existing one to SSH into your instance.
    *   In "Network settings", ensure your instance's security group allows inbound traffic on:
        *   **Port 22 (SSH)** from your IP address to allow you to connect.
        *   **Port 5000** (or your chosen server port) from anywhere (`0.0.0.0/0`) so the frontend can reach your API.
    *   Launch the instance.

2.  **Configure the Server**:
    *   Connect to your instance using SSH:
        ```bash
        ssh -i /path/to/your-key.pem ubuntu@<your_ec2_public_ip>
        ```
    *   Update the server and install Node.js, npm, and Git:
        ```bash
        sudo apt update
        sudo apt install -y nodejs npm git
        ```
    *   Clone your project repository:
        ```bash
        git clone <your_repository_url>
        ```
    *   Navigate to the API directory:
        ```bash
        cd your-project/API
        ```
    *   Install backend dependencies:
        ```bash
        npm install
        ```

3.  **Set Environment Variables**:
    *   Create a `.env` file to store your environment variables:
        ```bash
        nano .env
        ```
    *   Add the following content, replacing the placeholders with your Cloud SQL credentials:
        ```env
        DB_HOST=<your_cloud_sql_public_ip>
        DB_USER=<your_cloud_sql_user>
        DB_PASSWORD=<your_cloud_sql_password>
        DB_NAME=techheaven
        DB_PORT=3306
        PORT=5000
        ```
        *Note: The database name `techheaven` is based on the existing `db.js` file. Create this database in your Cloud SQL instance using a tool like MySQL Workbench or DBeaver.*

4.  **Run the Application with a Process Manager**:
    *   A process manager like `pm2` will keep your application running and restart it if it crashes.
    *   Install `pm2` globally:
        ```bash
        sudo npm install pm2 -g
        ```
    *   Start your API server:
        ```bash
        pm2 start index.js --name "my-app-api"
        ```
    *   Your backend is now running at `http://<your_ec2_public_ip>:5000`.

---

## Step 3: Build and Deploy the Frontend (AWS S3)

Finally, we'll deploy the static frontend assets.

1.  **Build the React App**:
    *   On your **local machine**, navigate to the `client` directory.
    *   The frontend needs to know the URL of your deployed backend. Create a file named `.env.production` inside the `client` directory.
    *   Add the following line to this file, replacing the placeholder with your EC2 instance's public IP:
        ```env
        VITE_API_URL=http://<your_ec2_public_ip>:5000/api
        ```
    *   Now, build the application:
        ```bash
        npm run build
        ```
    *   This will create a `dist` folder inside `client`, containing the optimized static files for production.

2.  **Deploy to S3**:
    *   Navigate to the AWS S3 console.
    *   Create a new bucket. The bucket name must be globally unique (e.g., `my-app-frontend-unique-name`).
    *   In the "Properties" tab of your bucket, enable "Static website hosting". Set the index document to `index.html`.
    *   In the "Permissions" tab, disable "Block all public access" and add a bucket policy to make the objects publicly readable. Use the policy generator to create one similar to this:
        ```json
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::<your_bucket_name>/*"
                }
            ]
        }
        ```
    *   Upload the **contents** of the `client/dist` folder to the root of your S3 bucket.

3.  **Access Your Application**:
    *   Your frontend is now accessible via the S3 static website hosting endpoint, which you can find in the "Properties" tab of your bucket.

---

## (Recommended) Step 4: Set Up a CDN (AWS CloudFront)

Using CloudFront will provide HTTPS, better performance, and a custom domain for your application.

1.  **Create a CloudFront Distribution**:
    *   Navigate to the AWS CloudFront console.
    *   Click "Create distribution".
    *   For the "Origin domain", select your S3 bucket from the dropdown list.
    *   Under "Viewer protocol policy", select "Redirect HTTP to HTTPS".
    *   Click "Create distribution".

2.  **Update DNS**:
    *   Once the distribution is deployed, CloudFront will provide a domain name (e.g., `d1234abcd.cloudfront.net`).
    *   You can now access your site through this CloudFront URL. If you have a custom domain, you can configure it by creating a CNAME record in your DNS settings that points your domain to the CloudFront domain name.

Your application is now fully deployed! 