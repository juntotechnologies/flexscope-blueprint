// Pure rules for the clip set: every truth label needs its paper quote, every clip a full credit; level rotation stays balanced.
const CREDIT_FIELDS = ['work', 'part', 'url', 'copyright', 'license', 'licenseUrl'];

function clipOwnIssues(clip) {
  const missing = CREDIT_FIELDS.filter(function absent(f) { return !clip.credit?.[f]; }).map(function say(f) { return `${clip.id}: credit.${f} missing`; });
  const labelled = Object.keys(clip.truth).length > 0;
  return labelled && !clip.truthQuote ? [...missing, `${clip.id}: truth without truthQuote`] : missing;
}

function clipIssues(clips, levelCount) {
  const ids = clips.map(function id(c) { return c.id; });
  const dupes = ids.filter(function seen(id, i) { return ids.indexOf(id) !== i; }).map(function say(id) { return `duplicate id ${id}`; });
  const balance = clips.length % levelCount ? [`${clips.length} clips is not a multiple of ${levelCount} levels`] : [];
  return [...dupes, ...balance, ...clips.flatMap(clipOwnIssues)];
}

module.exports = {clipIssues};
