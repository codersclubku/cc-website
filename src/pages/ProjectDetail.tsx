import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ExternalLink, GitPullRequest, Code2, Users } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { Badge } from '../components/Badge';
import { GithubIcon } from '../components/SocialIcons';
import { PROJECTS as STATIC_PROJECTS } from '../content/site';
import { fetchProjectBySlug } from '../lib/api';
import type { DbProject } from '../lib/api';

export const ProjectDetail: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const projectIdentifier = slug || id || '';
  const [project, setProject] = useState<DbProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const p = await fetchProjectBySlug(projectIdentifier);
        if (active) {
          if (p) {
            setProject(p);
          } else {
            const staticMatch = STATIC_PROJECTS.find((sp) => sp.id === projectIdentifier);
            if (staticMatch) {
              setProject({
                id: staticMatch.id,
                slug: staticMatch.id,
                title: staticMatch.title,
                summary: staticMatch.summary || staticMatch.description,
                status: staticMatch.status as any,
                tech_stack: staticMatch.techStack,
                repo_url: staticMatch.repositoryUrl,
                demo_url: null,
                how_to_contribute: staticMatch.howToContribute,
                published: true,
                created_at: new Date().toISOString()
              });
            } else {
              setNotFound(true);
            }
          }
        }
      } catch {
        if (active) {
          const staticMatch = STATIC_PROJECTS.find((sp) => sp.id === projectIdentifier);
          if (staticMatch) {
            setProject({
              id: staticMatch.id,
              slug: staticMatch.id,
              title: staticMatch.title,
              summary: staticMatch.summary || staticMatch.description,
              status: staticMatch.status as any,
              tech_stack: staticMatch.techStack,
              repo_url: staticMatch.repositoryUrl,
              demo_url: null,
              how_to_contribute: staticMatch.howToContribute,
              published: true,
              created_at: new Date().toISOString()
            });
          } else {
            setNotFound(true);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [projectIdentifier]);

  if (notFound) {
    return <Navigate to="/projects" replace />;
  }

  if (loading || !project) {
    return (
      <HairlineGrid>
        <section className="hairline-row p-8 sm:p-16 bg-[var(--bg)] min-h-[40vh] flex items-center justify-center">
          <div className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-wider">
            Loading project details...
          </div>
        </section>
      </HairlineGrid>
    );
  }

  return (
    <HairlineGrid>
      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-8 sm:py-12 bg-[var(--bg)] text-left" aria-labelledby="project-title">
        <div className="flex flex-col gap-6 w-full">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Link to="/" className="hover:text-[var(--text)] underline underline-offset-2">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/projects" className="hover:text-[var(--text)] underline underline-offset-2">
              Projects
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--text)] font-semibold" aria-current="page">
              {project.title}
            </span>
          </nav>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Badge variant={project.status === 'Live' ? 'confirmed' : 'in-progress'} label={project.status} />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                SLUG: {project.slug}
              </span>
            </div>

            <h1
              id="project-title"
              className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text)] leading-tight m-0"
            >
              {project.title}
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed m-0 max-w-[65ch]">
              {project.summary}
            </p>
          </div>

          <div className="p-5 sm:p-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-md shadow-1 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                Technology stack
              </span>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 text-xs font-mono bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-[var(--text)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-semibold shrink-0"
              >
                <GithubIcon className="w-4 h-4" />
                <span>View repository</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>

              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-btn cc-btn--secondary min-h-[44px] px-6 text-sm font-semibold shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Live Demo</span>
                </a>
              )}
            </div>
          </div>

          <div className="p-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-4 max-w-[65ch]">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="text-xl font-bold text-[var(--text)] m-0">
                Project details & architecture
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[var(--text)] leading-relaxed m-0 text-left">
              {project.summary}
            </p>
          </div>

          {project.how_to_contribute && (
            <div className="p-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-4 max-w-[65ch]">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-xl font-bold text-[var(--text)] m-0">
                  How to contribute
                </h2>
              </div>

              <p className="text-sm sm:text-base text-[var(--text)] leading-relaxed m-0 text-left">
                {project.how_to_contribute}
              </p>

              <div className="p-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-sm flex flex-col gap-1.5 font-mono text-xs">
                <div className="text-[var(--text-muted)]"># Clone the repository</div>
                <div
                  data-cursor="copy"
                  data-copy-text={`git clone ${project.repo_url}.git`}
                  className="text-[var(--text)] font-semibold select-all"
                >
                  git clone {project.repo_url}.git
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>
                  Contributions reviewed by student Web Masters. Conventions adhere to Kishkinda University Coders Club brand guidelines.
                </span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/projects"
              className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 font-semibold"
            >
              ← Back to all projects
            </Link>
          </div>
        </div>
      </section>
    </HairlineGrid>
  );
};
