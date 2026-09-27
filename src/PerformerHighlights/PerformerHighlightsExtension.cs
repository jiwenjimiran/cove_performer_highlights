using Cove.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Cove.PerformerHighlights;

public sealed class PerformerHighlightsExtension : IExtension, IUIExtension
{
    public string Id => "io.github.jiwenjimiran.performer-highlights";
    public string Name => "Performer Highlights Extension";
    public string Version => "1.0.1";
    public string? Description => "Red 1px borders around favorite performer badges.";
    public string? Author => "jiwenji";
    public string? Url => "https://github.com/jiwenjimiran/cove_performer_highlights";
    public string? IconUrl => null;
    public string? MinCoveVersion => "1.5.1";
    public IReadOnlyList<string> Categories => ["ui", "style"];
    public void ConfigureServices(IServiceCollection services, ExtensionContext context) { }
    public UIManifest GetUIManifest() => new()
    {
        Slots = [new UISlotContribution(
            Id: $"{Id}:highlights", Slot: "app-floating-ui", ExtensionId: Id,
            ComponentName: "PerformerHighlights")]
    };
}
