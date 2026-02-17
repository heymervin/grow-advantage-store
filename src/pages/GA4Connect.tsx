import { useSearchParams } from "react-router-dom";
import { Globe, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

const GA4Connect = () => {
  const [searchParams] = useSearchParams();
  const client = searchParams.get("client") || "";
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const property = searchParams.get("property");

  const handleConnect = () => {
    window.location.href = `/api/ga4-auth?client=${client}`;
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Missing Client</h1>
          <p className="text-muted-foreground">Add <code>?client=name</code> to the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Connect Google Analytics
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Client: <span className="font-semibold text-foreground">{client}</span>
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Connected!</p>
                {property && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Property: {property}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Connection failed</p>
                <p className="text-sm text-destructive/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {success ? "Reconnect Google Analytics" : "Connect Google Analytics"}
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            You'll be asked to sign in with Google and grant read-only access to your Analytics data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GA4Connect;
