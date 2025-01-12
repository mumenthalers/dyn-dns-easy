# dyn-dns-easy

easy dynamic dns built on AWS

## Architecture

Lambda, DynamoDB, Route53

## How to use

_Prereq: aws profile configured for sso login. if not yet done, [follow this guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)._

create a `.env` file in the project root directory with the following content:

```dotenv
AWS_PROFILE=YOUR_AWS_PROFILE_NAME_CONFIGURED_IN_YOUR_AWS_CONFIG
AWS_REGION=THE_REGION_YOU_WANT_TO_DEPLOY_TO
AWS_HOSTED_ZONE_IDS=COMMA_SEPARATED_LIST_OF_THE_IDS_OF_YOUR_HOSTED_ZONE_IDS
```

1. install all deps

```shell
npm ci
```

2. set env and login

```shell
source set_env
aws sso login
```

3. build it

```shell
npm run build
```

4. deploy

```shell
npm run deploy
```

## How to use

1. create entry in DynamoDB in the following format:
   - make sure the used zone id was provided to the env key when deploying, otherwise add it and deploy again
   - it is up to you how long the ttl should be, depending on how often you want to call the api
   - generate a secret key and use it in the request to update the record

```json
{
  "hostname": { "S": "my-host-name.ch" },
  "zoneId": { "S": "your-zone-for-your-domain" },
  "recordTtl": { "N": "172800" },
  "secret": { "S": "a-very-secret-key" }
}
```

2. after deploying you can execute the following command to get the api endpoint.\
   the command writes the `outputs.json` file which contains the api endpoint variable

```shell
./get-stack-outputs
```

3. on the given endpoint you can now update the ip address of the record by sending a post request
   - first get your public ip (e.g. by calling the api (see `apiFnUrl` in outputs.json)
   - store the current timestamp (seconds since epoch) in a variable
   - then calculate the hash (sha256 hex) of `ipAddress + hostname + tiemstamp + secret` (joined without any special characters)
   - finally send the following json to the endpoint

```json
{
  "ddns_hostname": "my-host-name.ch",
  "validation_hash": "the-calculated-hash",
  "timestamp": 1736598400
}
```

> you can use the provided [update-dns-record](client/update-dns-record.sh) script to automate this process\
> just set the env variables `SECRET`, `HOSTNAME` and `API_URL` and run the script\
> you can also use the [Dockerfile](./client/Dockerfile) to create an image and run it as a container
