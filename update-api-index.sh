#!/bin/bash
# Replaces the old entitlements fetching block in api/index.ts
cat api/index.ts | sed '/let planSlug = '\''free'\'';/{
    p
    n
    :a
    /const entitlements = getEntitlementsForPlan(planSlug);/!{
        N
        ba
    }
}' > api/index.ts.temp
