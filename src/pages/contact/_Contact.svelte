<script>
  import { Section, Contact } from "flowbite-svelte-blocks";
  import { Label, Input, Textarea, Button, Helper, Alert } from "flowbite-svelte";
  import { contactContent } from "../../config/contact";

  let email = "";
  let subject = "";
  let message = "";
  let isSubmitting = false;
  let submitResult = null;

  $: isEmailValid = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  $: emailColor = email.length === 0 ? "base" : isEmailValid ? "green" : "red";

  $: isValidSubject = subject.length > contactContent.validation.minSubjectLength;
  $: subjectColor =
    subject.length === 0 ? "base" : isValidSubject ? "green" : "red";

  $: isValidMessage = message.length > contactContent.validation.minMessageLength;
  $: messageColor =
    message.length === 0 ? "base" : isValidMessage ? "green" : "red";

  $: isValidForm = isEmailValid && isValidSubject && isValidMessage;

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (!isValidForm || isSubmitting) return;
    
    isSubmitting = true;
    submitResult = null;
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('subject', subject);
      formData.append('message', message);
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Clear form on success
        email = "";
        subject = "";
        message = "";
      }
      
      submitResult = result;
    } catch (error) {
      console.error('Error submitting form:', error);
      submitResult = {
        success: false,
        message: 'There was an error sending your message. Please try again later.'
      };
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Section name="contact">
  <Contact>
    <svelte:fragment slot="h2">{contactContent.title}</svelte:fragment>
    <svelte:fragment slot="paragraph">{contactContent.subtitle}</svelte:fragment>
    
    {#if submitResult}
      <Alert 
        color={submitResult.success ? "green" : "red"} 
        class="mb-6"
        dismissable
      >
        <span class="font-medium">{submitResult.message}</span>
      </Alert>
    {/if}
    
    <form class="space-y-8" on:submit={handleSubmit}>
      <div>
        <Label for="email" class="mb-2 block" color={emailColor}>
          {contactContent.form.email.label}
        </Label>
        <Input
          id="email"
          name="email"
          bind:value={email}
          placeholder={contactContent.form.email.placeholder}
          color={emailColor}
          required
        />
      </div>
      <div>
        <Label for="subject" class="mb-2 block" color={subjectColor}>
          {contactContent.form.subject.label}
        </Label>

        <Input
          id="subject"
          name="subject"
          bind:value={subject}
          color={subjectColor}
          placeholder={contactContent.form.subject.placeholder}
          required
        />
      </div>
      <div>
        <Label for="" class="mb-2 block" color={messageColor}>{contactContent.form.message.label}</Label>

        <Textarea
          id="message"
          name="message"
          bind:value={message}
          color={messageColor}
          placeholder={contactContent.form.message.placeholder}
          label=""
        />
        {#if message.length > 0 && !isValidMessage}
          <Helper class="mt-0" color="red">
            <span class="font-medium">{contactContent.form.message.validationMessage}</span>
          </Helper>
        {/if}
      </div>

      <Button 
        size="lg" 
        type="submit" 
        disabled={!isValidForm || isSubmitting} 
        color="primary"
      >
        {isSubmitting ? 'Sending...' : contactContent.form.submitButton.text}
      </Button>
    </form>
  </Contact>
</Section>
