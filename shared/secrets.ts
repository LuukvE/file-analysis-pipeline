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
    console.log('AWS Secrets error', error);
  }
}
