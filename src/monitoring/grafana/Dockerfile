FROM grafana/grafana:latest

USER root
RUN apk add --no-cache jq curl

# RUN addgroup -g 4222 2022_rome && \
#     adduser -D -H -u 13449 -G 2022_rome evocatur && \
#     chown -R evocatur:2022_rome /data

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY conf/15489_rev2.json /usr/local/bin/15489_rev2.json

RUN chmod +x /usr/local/bin/entrypoint.sh
RUN chmod 644 /usr/local/bin/15489_rev2.json

# USER evocatur

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["/run.sh"]
