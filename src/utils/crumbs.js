import { getProjectConfig, getPublisherConfig, getStoryConfig } from './config.js';

// The header's breadcrumb trail (D-177): a page's ancestors, nearest last,
// each { href, label }. The current page isn't in it. Addresses are site
// paths; SiteLayout puts them under the site's base. Every page gets its
// trail from here, so the chain is written once.

export function siteCrumbs() {
  return [{ href: '/', label: getPublisherConfig().name }];
}

// The projects hub is named by the site (`projects_label`), as its page is.
export function projectsCrumbs() {
  return [{ href: '/projects', label: getPublisherConfig().projects_label ?? 'Stories' }];
}

export function projectCrumbs(project) {
  return [...projectsCrumbs(), { href: `/projects/${project}`, label: getProjectConfig(project).title }];
}

export function wikiCrumbs(project) {
  return [...projectCrumbs(project), { href: `/${project}/wiki`, label: 'Wiki' }];
}

// `trail`: the arcs and chapters above the page, from storyReading().
export function storyCrumbs(project, story, trail = []) {
  return [
    ...projectCrumbs(project),
    { href: `/${project}/stories/${story}`, label: getStoryConfig(project, story).title },
    ...trail,
  ];
}
