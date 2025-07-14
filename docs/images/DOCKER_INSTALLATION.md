# Install Docker & docker compose

Perform update and upgrade

```
sudo apt update && sudo apt upgrade -y
``````
Install Docker via Script
```
curl -fsSL test.docker.com -o get-docker.sh && sh get-docker.sh
```
Add current user to the Docker Group
```
sudo usermod -aG docker ${USER}
```
Once configured, you can build and run the application using Docker Compose:

Check if it's running:
```
groups ${USER}
```

Reboot the Raspberry Pi to let the changes take effect
```
sudo reboot
```


