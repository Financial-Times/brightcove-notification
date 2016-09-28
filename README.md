# Get Brightcove status by id

## Deployment

### Setup

### AWS Credentials

#### Local
If deploying from a non-ec2 instance setup aws profile
http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-multiple-profiles

#### Set default profile in shell
'''export set AWS_DEFAULT_PROFILE=staging'''

#### Run gulp deployment
'''gulp --env=staging --lambdarole=FTFlexServices-Deployer --account=528773984231 --region=eu-west-1'''