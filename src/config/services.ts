export type ServiceItem = {
  title: string;
  icon: string;
  desc: string;
  link: string;
};

export type ServicePhase = {
  phase: string;
  icon: string;
  items: ServiceItem[];
};

export const services: ServicePhase[] = [
  {
    phase: 'Learn',
    icon: 'BookOpenOutline',
    items: [
      { 
        title: 'Discovery Workshop', 
        icon: 'LightbulbOutline', 
        desc: 'Collaborative sessions to understand your business needs and goals.',
        link: '/services/discovery'
      },
      { 
        title: 'Tech Audit', 
        icon: 'SearchOutline', 
        desc: 'Comprehensive analysis of your existing systems and infrastructure.',
        link: '/services/audit'
      },
      { 
        title: 'Training Sessions', 
        icon: 'PenOutline', 
        desc: 'Educational workshops to empower your team with new skills.',
        link: '/services/training'
      }
    ]
  },
  {
    phase: 'Strategize',
    icon: 'ChartOutline',
    items: [
      { 
        title: 'Solution Architecture', 
        icon: 'CodeOutline', 
        desc: 'Designing scalable technical solutions tailored to your needs.',
        link: '/services/architecture'
      },
      { 
        title: 'Project Planning', 
        icon: 'ClipboardListOutline', 
        desc: 'Detailed roadmaps and timelines for successful implementation.',
        link: '/services/planning'
      },
      { 
        title: 'UX/UI Design', 
        icon: 'PenOutline', 
        desc: 'Creating intuitive and engaging user experiences.',
        link: '/services/design'
      }
    ]
  },
  {
    phase: 'Implement',
    icon: 'RocketOutline',
    items: [
      { 
        title: 'Development', 
        icon: 'CodeOutline', 
        desc: 'Expert coding and implementation of your digital solutions.',
        link: '/services/development'
      },
      { 
        title: 'Testing & QA', 
        icon: 'BugOutline', 
        desc: 'Rigorous quality assurance to ensure flawless performance.',
        link: '/services/testing'
      },
      { 
        title: 'Deployment & Support', 
        icon: 'CloudArrowUpOutline', 
        desc: 'Smooth launch and ongoing maintenance of your platforms.',
        link: '/services/deployment'
      }
    ]
  }
];
