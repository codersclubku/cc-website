import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { Badge } from '../components/Badge';
import { GithubIcon } from '../components/SocialIcons';
import { SpotlightCard } from '../components/SpotlightCard';
import { StaggerGrid, StaggerItem } from '../components/ScrollReveal';
import { PROJECTS as STATIC_PROJECTS, SITE_CONSTANTS } from '../content/site';
import { fetchPublishedProjects } from '../lib/api';
import type { DbProject } from '../lib/api';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const list = await fetchPublishedProjects();
        if (active) {
          if (list.length > 0) {
            setProjects(list);
          } else {
            const fallback: DbProject[] = STATIC_PROJECTS.map((p) => ({
              id: p.id,
              slug: p.id,
              title: p.title,
              summary: p.summary || p.description,
              status: p.status as any,
              tech_stack: p.techStack,
              repo_url: p.repositoryUrl,
              demo_url: null,
              how_to_contribute: p.howToContribute,
              published: true,
              created_at: new Date().toISOString()
            }));
            setProjects(fallback);
          }
        }
      } catch {
        if (active) {
          const fallback: DbProject[] = STATIC_PROJECTS.map((p) => ({
            id: p.id,
            slug: p.id,
            title: p.title,
            summary: p.summary || p.description,
            status: p.status as any,
            tech_stack: p.techStack,
            repo_url: p.repositoryUrl,
            demo_url: null,
            how_to_contribute: p.howToContribute,
            published: true,
            created_at: new Date().toISOString()
          }));
          setProjects(fallback);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <HairlineGrid>
      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)] text-left" aria-labelledby="projects-heading">
        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                Open Source & Engineering
              </span>
              <h1
                id="projects-heading"
                className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight m-0 mt-1"
              >
                Projects
              </h1>
              <p className="text-base text-[var(--text-muted)] mt-2 max-w-2xl">
                Every project lives in the club&apos;s GitHub organisation. We believe in building software that serves the student community.
              </p>
            </div>

            <a
              href={SITE_CONSTANTS.githubOrgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 shrink-0 font-semibold"
            >
              <span>GitHub organisation</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 bg-[var(--surface-1)] border border-[var(--border)] rounded-md animate-pulse p-6" />
              ))}
            </div>
          ) : (
            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {projects.map((project) => (
                <StaggerItem key={project.id}>
                  <SpotlightCard className="p-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col justify-between gap-5 h-full text-left">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="in-progress" label={project.status} />
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {project.slug || project.id}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] m-0">
                        {project.title}
                      </h2>

                      <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0">
                        {project.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--border)] rounded-sm text-[var(--text-subtle)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                      <Link
                        to={`/projects/${project.slug || project.id}`}
                        className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 inline-flex items-center gap-1 font-semibold"
                      >
                        <span>View project details</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>

                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)]"
                        aria-label={`Repository for ${project.title}`}
                      >
                        <GithubIcon className="w-4 h-4" />
                        <span>Repository</span>
                      </a>
                    </div>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}
        </div>
      </section>
    </HairlineGrid>
  );
};
