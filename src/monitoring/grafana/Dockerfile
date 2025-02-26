FROM grafana/grafana:latest

USER root
RUN apk add --no-cache jq curl

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY conf/15489_rev2.json /usr/local/bin/15489_rev2.json

RUN chmod +x /usr/local/bin/entrypoint.sh
RUN chmod 644 /usr/local/bin/15489_rev2.json

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["/run.sh"]
