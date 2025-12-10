FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/package*.json ./


COPY --from=build /app/public ./public

ENV PORT 3000
EXPOSE 3000

USER appuser

CMD ["npm", "start"]
