import { ExternalLink, Plug, RefreshCw, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ServerUrlField from '@/components/connect/ServerUrlField';
import Steps from '@/components/connect/Steps';

const APP_NAME = 'InvestArch';

export default function Connect() {
  const serverUrl = new URL('/api/mcp', window.location.origin).toString();
  const claudeLink = `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(APP_NAME)}&connectorUrl=${encodeURIComponent(serverUrl)}`;

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Connect an AI Assistant"
        subtitle="Point Claude, ChatGPT, Cursor or any MCP-capable assistant at this app's server so it can read your dossiers, seeds and signals — and act as you."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <Plug className="size-4 text-bottle" /> Server endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ServerUrlField />
          <p className="text-xs text-muted-foreground">
            Streamable HTTP transport. The endpoint only answers once the app is published.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="claude">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="claude">Claude</TabsTrigger>
          <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
          <TabsTrigger value="cursor">Cursor</TabsTrigger>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>

        <TabsContent value="claude" className="mt-4">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <Steps items={[
                <>Open Claude's custom connector form with <span className="text-foreground">Add to Claude</span> below — name and URL are pre-filled. If the URL field is empty, paste it from the endpoint above, then click <span className="text-foreground">Add</span>.</>,
                'Keep this tab open for the consent step below: Claude opens the app sign-in and approval page on first use.'
              ]} />
              <Button asChild className="bg-bottle text-bottle-foreground hover:bg-bottle/90">
                <a href={claudeLink} target="_blank" rel="noreferrer">
                  Add to Claude <ExternalLink className="size-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatgpt" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Steps items={[
                'In the ChatGPT desktop app, open Settings and choose Plugins.',
                <>Open the <span className="text-foreground">MCPs</span> tab and click <span className="text-foreground">Add server</span>.</>,
                `Name it ${APP_NAME}, set Type to Streamable HTTP, paste the server URL, then Save.`,
                'Restart ChatGPT and enable the server.'
              ]} />
              <p className="text-xs text-muted-foreground">
                On the web, custom MCP servers go through Developer mode instead of the Plugins menu.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursor" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Steps items={[
                <>Open <span className="text-foreground">Customize</span>, choose the <span className="text-foreground">MCPs</span> tab and click <span className="text-foreground">New MCP Server</span> — this opens <code className="font-mono text-xs">mcp.json</code>.</>,
                'Add an entry whose url is this server URL, then save the file.',
                'Toggle the server on in the MCPs list.'
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="others" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Steps items={[
                'Copy the server URL from the endpoint above.',
                'Add it as a streamable HTTP MCP server in your client — a name and the URL is all most clients need.',
                'Reload the client so it picks up the tool list.'
              ]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2 font-heading text-base">
            <ShieldCheck className="size-4 text-bottle" /> Sign-in required
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This server is sign-in protected. Each client takes one extra step on first use: it opens the app's consent page,
            where you sign in with your own account and approve the tools it may call. The assistant only ever acts as you,
            within your own permissions.
          </p>
          <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
            <RefreshCw className="mt-0.5 size-3.5 shrink-0" />
            <span>Assistants cache the tool list. After we ship changes, reopen or reconnect the connector in your client to pick up new tools.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}