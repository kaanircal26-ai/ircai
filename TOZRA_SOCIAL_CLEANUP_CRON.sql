-- Run after deploying cleanup-community-stories and adding both Vault secrets.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'tozra-cleanup-expired-stories';

select cron.schedule(
  'tozra-cleanup-expired-stories',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'tozra_project_url') || '/functions/v1/cleanup-community-stories',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'tozra_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
