# 서버 인증서·nginx 설정 작업 프롬프트

서버(sangt)에서 작업하는 Claude에게 아래 내용을 그대로 붙여 넣는다.

---

## 상황
서버(sangt)에서 JoyCraft 프론트가 https://api.chaenesis.site/survey/awe2026/start 를 호출하는데
브라우저에서 net::ERR_CERT_COMMON_NAME_INVALID 가 납니다. 원인을 확인하고 고쳐 주세요.

## 이미 확인된 사실
- 80/443은 도커 컨테이너 `nfm-nginx`(다른 프로젝트 nfm 소유)가 점유 중입니다. 절대 중지·재생성하지 마세요.
  - 설정 파일: /home/sangt/nas-file-manager/nginx/default.conf (읽기 전용 바인드 마운트)
  - 마운트: /etc/letsencrypt(ro), /home/sangt/nas-file-manager/certs, /home/sangt/joyCraft/web/dist -> /var/www/chaenesis.site(ro)
  - 정의된 server 블록은 chaenesis.site(웹 정적), nas.chaenesis.site 뿐입니다. api.chaenesis.site 블록은 없어서 기본 서버 인증서로 응답 중입니다.
  - 컨테이너가 backend:3000, frontend:80 을 프록시하는 것으로 보아 같은 도커 네트워크를 씁니다.
- /etc/letsencrypt/live/ 에는 api.smbchurch.site, chaenesis.site, nas.chaenesis.site, smbchurch.site, www.smbchurch.site 가 있고 **api.chaenesis.site 인증서는 없습니다.**
- 호스트 nginx(/etc/nginx/sites-enabled/api.chanesis.site)에는 오타 도메인(chanesis) HTTP 전용 설정이 있고 localhost:8080 으로 프록시합니다. 호스트 nginx는 80 충돌로 기동되지 않는 상태(실패 중)입니다. 이 설정이 현재 유효한지 불분명합니다.
- 8080 은 python3(pid 996400)가 점유 중이며 정체 미확인입니다. JoyCraft API(joy_craft_api)는 로컬 개발 기준 8310 포트인데 서버에서는 8310이 열려 있지 않습니다.
- DNS: api.chaenesis.site -> 202.150.191.175 (이 서버 공인 IP와 같은지 미확인)

## 해야 할 일 (순서대로, 각 단계 결과를 보고하고 다음으로 진행)
1. 조사만 먼저 합니다 (변경 금지):
   - `ps -fp 996400` 로 8080의 python3 정체 확인
   - `sudo docker ps -a` 와 `docker network ls` 로 JoyCraft API 컨테이너 존재 여부 확인
   - `systemctl list-units --type=service --state=running | grep -iE 'joy|craft|java|spring'`
   - `curl -s ifconfig.me` 로 공인 IP 확인 후 DNS(202.150.191.175)와 비교
   - /home/sangt 아래에서 joyCraft API 배포 위치 탐색 (예: /home/sangt/joyCraft/)
   - **JoyCraft API가 이 서버에서 실제로 실행 중인지, 어느 호스트:포트로 듣는지** 결론을 내려 보고합니다. 실행 중이 아니면 여기서 멈추고 나에게 알려 주세요.
2. API가 실행 중이고 DNS가 이 서버를 가리키면:
   - api.chaenesis.site 인증서 발급. 80포트를 nfm-nginx가 쓰고 있고 모든 80 요청을 https로 301 리다이렉트하므로 `certbot --standalone`은 쓰지 말고, webroot 방식(nfm-nginx에 /.well-known/acme-challenge/ 처리 추가) 또는 DNS 챌린지 중 안전한 방법을 제안해서 나에게 먼저 확인받으세요.
   - /home/sangt/nas-file-manager/nginx/default.conf 에 server 블록을 **추가만** 합니다 (기존 블록 수정 금지, 수정 전 .bak 백업):
     - listen 443 ssl; server_name api.chaenesis.site; /etc/letsencrypt/live/api.chaenesis.site/ 인증서 사용
     - API 컨테이너/호스트:포트로 proxy_pass (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto 헤더 포함)
     - CORS는 API 앱이 이미 처리하는지 확인 후 중복 추가하지 않기. 필요하면 허용 오리진은 https://chaenesis.site
     - 컨테이너가 호스트 localhost를 못 보므로, API가 호스트에서 돌면 host.docker.internal 또는 도커 게이트웨이 IP 사용 여부 확인
   - 반영: `sudo docker exec nfm-nginx nginx -t` 통과 후에만 `sudo docker exec nfm-nginx nginx -s reload`
3. 검증:
   - `curl -vI https://api.chaenesis.site/` 로 인증서 CN/SAN 확인
   - `curl -i -X POST https://api.chaenesis.site/survey/awe2026/start` 응답 확인 (404면 설문 엔드포인트가 API에 배포되지 않은 것이므로 보고)
   - nas.chaenesis.site, chaenesis.site 가 여전히 정상인지 확인

## 제약
- nfm-nginx 컨테이너 중지/삭제/재생성 금지, nfm 관련 기존 설정 수정 금지.
- 호스트 nginx를 80/443으로 띄우려 하지 마세요.
- 파일을 바꾸기 전에 백업하고, 무엇을 바꿨는지 마지막에 요약해 주세요.
- 불확실하거나 되돌리기 어려운 작업은 실행 전에 나에게 물어보세요.
