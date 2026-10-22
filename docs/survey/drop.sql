-- 설문 실험 수집 종료 후 원복용. 실행 전에 반드시 백업과 CSV 내려받기를 끝낼 것:
--   pg_dump -t 'sv_*' joy_craft > sv_backup_YYYYMMDD.sql
--   curl -H "X-Admin-Key: $KEY" "https://<api>/api/survey/admin/<code>/export.csv" -o final.csv
-- 기존 flyway_schema_history 는 설문 작업에서 한 번도 건드리지 않았으므로 정리할 것이 없다.

DROP TABLE IF EXISTS
  sv_page_visit, sv_answer, sv_quota_hold, sv_respondent,
  sv_question_option, sv_quota, sv_question, sv_stimulus_block, sv_page, sv_survey,
  sv_flyway_schema_history
CASCADE;
