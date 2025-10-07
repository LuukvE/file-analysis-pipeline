import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export async function getSecrets(
  SecretId: string,
  region: string = 'eu-west-1'
): Promise<Record<string, any> | undefined> {
  const client = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId });

  try {
    const response = await client.send(command);

    if (response.SecretString) return JSON.parse(response.SecretString);
  } catch (error) {
    // Do not log the error, it might reveal secrets we can't put in the log
    console.log('AWS Secrets error', SecretId, region);
  }
}
