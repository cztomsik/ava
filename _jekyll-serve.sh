#!/bin/bash

lima nerdctl run --rm -it \
  -p 4000:4000 \
  -v $(pwd):/src \
  -v /tmp/lima/jekyll:/work \
  ruby:2.7-bullseye\
  sh -c 'bundle init; \
         bundle add jekyll --version "~> 3.9.5"; \
         bundle add github-pages --group jekyll_plugins; \
         bundle install && bundle exec jekyll serve -s /src --H=0.0.0.0 --force_polling'
