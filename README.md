# devops-ci-jenkins-docker-sonarqube

<div align="center">
  <h1 style="color: red;">Solve microservices-k8s-helm-jenkins task :globe_with_meridians::hammer_and_wrench:</h1>
</div> 

## :zap: DevOps Assignment

![task](https://github.com/AbdelrhmanAli123/microservices-devops-task/assets/133269614/3b3cc50b-c9d6-47f1-9f2e-8d19b8075a04)


## 
## :scroll: Overview

In this project, I implemented a DevOps pipeline with two Git repos. The first, managed by Jenkins using two pipeline, the first one automates code quality analysis, Docker image builds and pushes to Docker Hub and triggers the second pipeline to update the manifest files that are uploaded in the other repo. The second repo contains Kubernetes manifests linked to ArgoCD for continuous deployment on an EKS cluster. ArgoCD automates deployment based on changes in manifest files. Utilized HTTPS to secure Jenkins, SonarQube servers, and Kubernetes ingress, I used Prometheus and Grafana, deployed via HELM chart on the cluster, for monitoring both the application and the EKS cluster.
## :gear: Tools :-
- Docker
- sonarqube
- eksctl
- kubectl
- K8S (AWS EKS)
- Jenkins
- Argocd
- Helm chart
- prometheus
- grafana

## :diamond_shape_with_a_dot_inside: Assumptions

- I assume that you have a basic understanding of Nodejs, Docker, Kubernetes, Helm, jenkins and Amazon EKS.

## ⌛  Steps

1. **Configure servers**
  - first server for jenkins
  - second one for sonarqube
  - use userdata for installing the jenkins and sonarqube attached in this repo
    ![sonar-and-jenkins](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/ffe8af7f-0cf0-4db9-a3ed-428e8f8b2819)
  - note: I add configuration for Nginx to work as revers proxy and later will install the tls certificate on these servers
  - create two DNS record type A and map them two the servers IPs
    ![final dns record jenkins sonarqube](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/025c3cdc-f994-409c-a3e3-fc67a2f88f5e)
  - install the certbot utility to apply the TLS certificate
      ```bash
          sudo snap install core; sudo snap refresh core
          sudo apt remove certbot
          sudo snap install --classic certbot
          sudo ln -s /snap/bin/certbot /usr/bin/certbot
          sudo certbot --nginx  #you will need to add the domain name, email, and other configuration and certbot will configure the HTTPS and TLS configuration automatically  
      ```
  - verify that the TLS certificates installed correctly 
    ![jenkinstls](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/7c09a482-b933-41f3-ba70-ad650162dabb)
    ![sonartls](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/61582c9b-f4a9-4e44-8cdf-e88ffe1f1ee4)

2. **Configure sonar and jenkins and create two pipeline**
   - install the required sonarqube plugin
     ![sonar plugin](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/a0fde2f3-f865-48cb-9379-033e8bd24dda)
   - create project in sonarqube to use its name and key in the sonarqube in Jenkins file
     ![Capture](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/c557331b-86de-4605-ac3a-98acda3d2539)
   - add the domain name of you sonarqube or ip in the sonarqube configuration in jenkins server
     ![sonar-conf](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/8a324cfb-6e8e-466a-81a2-b5486d05f8e6)
   - create quality gateway in the sonarqube to stop the pipeline if the bugs or any thing else is above the threshold
     ![sonar-conf2](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/cf68119a-d3c4-4cd3-8f37-d6fe3f710169)
   - create first pipeline to test the code quality and build and push the image to docker hub and trigger the second pipeline
   - create second pipeline to update the k8s manifest files
     ![two-pipe](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/ad61d687-00b7-44f2-9f4f-85ce3d8c6c0f)   

3. **Create the AWS EKS using eksctl tool**
    - first you have to add your aws credential to allow eksctl to utlize them and build the EKS cluster
    - install the kubectl to communicate with the cluster
     
    ```bash
        eksctl create cluster --name my-eks --region your-region --version you-cluster-version --nodegroup-name my-eks-node-group --node-type t3.small --nodes 2 --ssh-public-key your/puplic/ip/path  --nodes-min 1      --nodes-max 3 --node-private-networking=false 

    ```
4. **Install the CSi driver for eks using eksctl to create EBS volume for the Application**
    ```bash
    # We have to do some steps before installing the CSI driver to allow the EKS to be authorized to provision EBS volume

    # variables used to create EKS
    export AWS_PROFILE="my-profile" # CHANGE ME IF YOU HAVE MUTIBLE AWS ACC
    export EKS_CLUSTER_NAME="my-cluster" # CHANGE ME
    export EKS_REGION="us-east-2" # CHANGE ME
    export EKS_VERSION="1.26"  # CHANGE ME IF YOU NEED
        
    # variables used in automation
    export ROLE_NAME="${EKS_CLUSTER_NAME}_EBS_CSI_DriverRole"
    export ACCOUNT_ID=$(aws sts get-caller-identity \
      --query "Account" \
      --output text
    )
    echo ${ACCOUNT_ID} 

    export ACCOUNT_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

    # Add OIDC Provider Support
    eksctl utils associate-iam-oidc-provider \
      --cluster $EKS_CLUSTER_NAME \
      --region $EKS_REGION \
      --approve

    # AWS managed policy for CSI driver SA to make EBS API calls
    POLICY_ARN="arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
    
    # AWS IAM role bound to a Kubernetes service account
    eksctl create iamserviceaccount \
      --name "ebs-csi-controller-sa" \
      --namespace "kube-system" \
      --cluster $EKS_CLUSTER_NAME \
      --region $EKS_REGION \
      --attach-policy-arn $POLICY_ARN \
      --role-only \
      --role-name $ROLE_NAME \
      --approve


    # Create Addon
    eksctl create addon \
      --name "aws-ebs-csi-driver" \
      --cluster $EKS_CLUSTER_NAME \
      --region=$EKS_REGION \
      --service-account-role-arn $ACCOUNT_ROLE_ARN \
      --force

    
    # Get status of the driver, must be STATUS=ACTIVE
    eksctl get addon \
      --name "aws-ebs-csi-driver" \
      --region $EKS_REGION \
      --cluster $EKS_CLUSTER_NAME

    
    # You can check on the running EBS CSI pods with the following command:
    kubectl get pods \
      --namespace "kube-system" \
      --selector "app.kubernetes.io/name=aws-ebs-csi-driver"

    # note: There is other way to install the CSI driver using HELM chart :)
     ```
    
5. **Install the nginx ingress controller using helm**
    ```bash
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    
    helm upgrade --install ingress-nginx ingress-nginx \ 
             --repo https://kubernetes.github.io/ingress-nginx \ 
             --namespace ingress-nginx \
             --create-namespace
    ```
6. **Install the cert-manager to manage the TLS certificate**
    ```bash
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
    ```
7. **Deploy the manifest files using argocd**
   - first add your repo in the argocd
     ![argooooorepo](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/693f0ece-1c9f-48fe-a9b9-db6250759736)
   - create application on ArgoCD and click on sync
      ![argo-msy](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/0e02622a-a118-41a6-bf68-e0a46387c068)
      ![argoafter](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/5d98bd3f-c141-4667-89ca-37e099639fe8)
8. **Add another DNS recorded for your Ingress controller**
   - ![final dns record](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/96240aab-1e3e-4412-817b-afc879f2aed6)
9. **Create ingress resource and apply TLS certificate**
    - create the following resource (ingress resource, ClusterIssuer, Certificate)
   ```bash
    apiVersion: cert-manager.io/v1
    kind: ClusterIssuer
    metadata:
      name: kubeissuer
    spec:
      acme:
        # The ACME server URL
        server: https://acme-v02.api.letsencrypt.org/directory
        # Email address used for ACME registration
        email: demo@demo.com                                                     #CHANGE ME
        # Name of a secret used to store the ACME account private key
        privateKeySecretRef:
          name: kubeissuer
        # Enable the HTTP-01 challenge provider
        solvers:
        - http01:
            ingress:
              class: nginx
    ---
    apiVersion: cert-manager.io/v1
    kind: Certificate
    metadata:
      name: kubecert
      namespace: demo                                                           #CHANGE ME
    spec:
      secretName: demo
      issuerRef:
        name: kubeissuer
        kind: ClusterIssuer
      commonName: www.myapp.balloapi.online                      #CHANGE ME
      dnsNames:
      - www.myapp.balloapi.online                               #CHANGE ME
    ---
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      annotations:
        cert-manager.io/cluster-issuer: kubeissuer
        kubernetes.io/ingress.class: nginx
      name: kube-certs-ingress
      namespace: demo                                                                        #CHANGE ME
    spec:
      rules:
      - host: www.myapp.balloapi.online                                                      #CHANGE ME
        http:
          paths:
          - backend:
              service:
                name: kube-certs                                                             #CHANGE ME
                port:
                  number: 80                                                                 #CHANGE ME
            path: /
            pathType: Prefix
      tls:
      - hosts:
        - www.myapp.balloapi.online                                                         #CHANGE ME
        secretName: kubeissuer                                                                    
   ```

10. **Try to access the application to see if the TLS applied correctly !**
    ### the app works on the /login route !
    ![app-apear](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/5a7d1eab-2878-46c6-a31a-a72907f3fbdb)
    ![cert](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/a899bd9d-82d4-4303-a0e1-323eaff1752d)
    - Use postman to send post request
      ![postman](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/ff1fcc03-d783-45e2-a28d-b8a64f71cc1b)
      ![after postman](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/4499f341-c28d-4cfd-a61c-fcac7f3e59a6)


11. **Instll Prometheus and Grafana using Helm**
    ```bash
     helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
     helm repo update
     helm install prometheus prometheus-community/kube-prometheus-stack
     kubectl port-forward service/grafana 3000:80
    ```
    
12. **Display the Grafana matrics**
    
      ![grafana1](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/7dd1ecb3-0bee-44e3-9642-8e7d0057ff3f)
      ![grafana2](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/7b1c34e8-985c-41bd-ad0b-60a47cb508f3)
      ![grafana3](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/fbac841e-950e-4a37-b1c2-ad3b06493d78)
      ![grafana4](https://github.com/AbdelrhmanAli123/CICD-Jenkins-ArgoCD-Prometheus-Grafana/assets/133269614/e44c7606-0a65-46c8-b27a-be7ee8e1df67)


## :rocket: Conclusion

Congratulations on completing the project ! By following the detailed steps outlined in this README, you've successfully deployed a sample web application using argocd for continuous deployment.

