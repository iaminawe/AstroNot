export interface ContactContent {
  title: string;
  subtitle: string;
  form: {
    email: {
      label: string;
      placeholder: string;
    };
    subject: {
      label: string;
      placeholder: string;
    };
    message: {
      label: string;
      placeholder: string;
      validationMessage: string;
    };
    submitButton: {
      text: string;
    };
  };
  validation: {
    minSubjectLength: number;
    minMessageLength: number;
  };
}

export const contactContent: ContactContent = {
  title: "Contact",
  subtitle: "Have any questions or comments? Get in touch!",
  form: {
    email: {
      label: "Your email",
      placeholder: "buzz@astronot.com"
    },
    subject: {
      label: "Subject",
      placeholder: "What's up?"
    },
    message: {
      label: "Message",
      placeholder: "This form is only for testing purposes and does not actually submit a message.",
      validationMessage: "Please enter a valid message. At least a few words 😄"
    },
    submitButton: {
      text: "Send message"
    }
  },
  validation: {
    minSubjectLength: 5,
    minMessageLength: 20
  }
};
