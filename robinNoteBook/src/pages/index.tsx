import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import BrowserOnly from '@docusaurus/BrowserOnly';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-6xl">🎯</span>
          </div>
          <Heading as="h1" className="hero__title">
            Robin's Arsenal
          </Heading>
          <p className="hero__subtitle text-xl mb-2">
            💡 知识弹药库 | 技术沉淀站
          </p>
          <p className="text-lg opacity-80 mb-6">
            从算法到工程，从理论到实践 - 这里是我的技术军火库
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg mr-4"
              to="/main/intro">
              🚀 探索弹药库
            </Link>
            <Link
              className="button button--outline button--lg"
              to="/blog">
              📝 战斗日志
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <BrowserOnly>
      {() => (
        <Layout
          title="Robin's Arsenal - 技术弹药库"
          description="Robin的个人技术知识库，涵盖算法、前端、工程化等各个领域的技术沉淀">
          <HomepageHeader />
          <main>
            <section className="padding-vert--lg">
              <div className="container">
                <div className="row">
                  <div className="col col--4">
                    <div className="text-center padding--md">
                      <h3>🔧 技术栈</h3>
                      <p>JavaScript/TypeScript, React, Node.js, 算法与数据结构</p>
                    </div>
                  </div>
                  <div className="col col--4">
                    <div className="text-center padding--md">
                      <h3>📚 知识体系</h3>
                      <p>从基础理论到实战项目，系统化的技术知识沉淀</p>
                    </div>
                  </div>
                  <div className="col col--4">
                    <div className="text-center padding--md">
                      <h3>🎯 持续更新</h3>
                      <p>记录学习过程，分享技术心得，知行合一</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* <HomepageFeatures /> */}
          </main>
        </Layout>
      )}
    </BrowserOnly>
  );
}