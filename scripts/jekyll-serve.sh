#!/bin/bash

rm -rf /tmp/lima/jekyll
mkdir -p /tmp/lima/jekyll

cat <<EOF > /tmp/lima/jekyll/Gemfile
source "https://rubygems.org"
gem "jekyll", "~> 3.9.5"
gem "github-pages", group: :jekyll_plugins
EOF

lima nerdctl run --rm -it \
  -p 4000:4000 \
  -v $(pwd):/src \
  -v /tmp/lima/jekyll:/work \
  ruby:2.7-bullseye\
  sh -c 'cd /work; \
         bundle install --jobs 8 && bundle exec jekyll serve -s /src --H=0.0.0.0 --force_polling'
